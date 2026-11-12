package com.example.sirh.service;

import com.example.sirh.dto.CreateCareerEventRequest;
import com.example.sirh.dto.CreateEmployeeContractRequest;
import com.example.sirh.dto.EmployeeProfileResponse;
import com.example.sirh.dto.RetentionPolicyRequest;
import com.example.sirh.dto.UpdateEmployeeRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class EmployeeAdministrationService {
    private static final List<String> REQUIRED_RETENTION_CATEGORIES=List.of("DOSSIER","DOCUMENTS","CONTRATS","CARRIERE");
    private static final Set<String> CONTRACT_TYPES=Set.of("CDI","CDD","STAGE","ALTERNANCE");
    private static final Set<String> WORK_REGIMES=Set.of("FORFAIT_JOURS_218","HEBDO_35H","HEBDO_39H");
    private static final Set<String> TELEWORK_DAYS=Set.of("LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI");
    private final JdbcTemplate jdbc;
    private final EmployeeCoreService employees;
    private final EmployeeAccessService access;
    private final EmployeeGdprAuditService audit;
    private final NationalIdCryptoService crypto;

    public EmployeeAdministrationService(JdbcTemplate jdbc, EmployeeCoreService employees,
            EmployeeAccessService access, EmployeeGdprAuditService audit, NationalIdCryptoService crypto) {
        this.jdbc=jdbc; this.employees=employees; this.access=access; this.audit=audit; this.crypto=crypto;
    }

    @Transactional
    public EmployeeProfileResponse update(int id, UpdateEmployeeRequest request, Authentication actor) {
        access.requireHr(actor);
        var current=jdbc.query("SELECT department_id,manager_id,status FROM employees WHERE id=?",
                (rs,row)->new String[]{rs.getString(1),rs.getString(2),rs.getString(3)},id).stream().findFirst()
                .orElseThrow(()->new ResourceNotFoundException("Salarié introuvable."));
        String department=blank(request.departmentId())==null?current[0]:request.departmentId().trim();
        String manager=blank(request.managerId())==null?current[1]:request.managerId().trim();
        if(manager!=null&&jdbc.queryForObject("SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?",
                Integer.class,manager,department)==0) throw new IllegalArgumentException("Le manager ne supervise pas le département choisi.");
        if(request.teleworkDays()!=null&&!TELEWORK_DAYS.containsAll(request.teleworkDays()))
            throw new IllegalArgumentException("Les jours de télétravail doivent être des jours ouvrés reconnus.");
        String status=blank(request.status())==null?current[2]:request.status().trim();
        if(!Set.of("actif","suspendu","sorti").contains(status)) throw new IllegalArgumentException("Statut salarié non reconnu.");
        if("sorti".equals(status)&&request.exitDate()==null&&currentExitDate(id)==null)
            throw new IllegalArgumentException("La date de sortie est requise pour clôturer le dossier.");
        String encryptedNir=crypto.encrypt(request.nationalId());
        String encryptedIban=crypto.encrypt(request.iban());
        String workDays=request.teleworkDays()==null?null:request.teleworkDays().isEmpty()?"{}":"{"+String.join(",",request.teleworkDays())+"}";
        jdbc.update("""
                UPDATE employees SET first_name=COALESCE(?,first_name),last_name=COALESCE(?,last_name),
                    email_pro=COALESCE(?,email_pro),email_perso=COALESCE(?,email_perso),phone=COALESCE(?,phone),
                    birth_date=COALESCE(?,birth_date),department_id=?,manager_id=?,status=?,
                    exit_date=CASE WHEN ?='actif' THEN NULL ELSE COALESCE(?,exit_date) END,
                    nationality=COALESCE(?,nationality),national_id_encrypted=COALESCE(?,national_id_encrypted),
                    rib_encrypted=COALESCE(?,rib_encrypted),address_street=COALESCE(?,address_street),
                    address_city=COALESCE(?,address_city),address_zip=COALESCE(?,address_zip),
                    emergency_contact_name=COALESCE(?,emergency_contact_name),emergency_contact_phone=COALESCE(?,emergency_contact_phone),
                    office_location=COALESCE(?,office_location),telework_days=COALESCE(?::text[],telework_days)
                WHERE id=?
                """,blank(request.firstName()),blank(request.lastName()),blank(request.emailPro()),blank(request.personalEmail()),
                blank(request.phone()),request.birthDate(),department,manager,status,status,request.exitDate(),blank(request.nationality()),
                encryptedNir,encryptedIban,blank(request.addressStreet()),blank(request.addressCity()),blank(request.addressZip()),
                blank(request.emergencyContactName()),blank(request.emergencyContactPhone()),blank(request.officeLocation()),workDays,id);
        boolean wasCounted="actif".equals(current[2]);boolean isCounted="actif".equals(status);
        if(wasCounted&&(!current[0].equals(department)||!isCounted))
            jdbc.update("UPDATE departments SET headcount_current=GREATEST(0,headcount_current-1) WHERE id=?",current[0]);
        if(isCounted&&(!current[0].equals(department)||!wasCounted))
            jdbc.update("UPDATE departments SET headcount_current=headcount_current+1 WHERE id=?",department);
        if(!current[0].equals(department)){
            career(id,"MOBILITE",request.exitDate()==null?LocalDate.now():request.exitDate(),"Mobilité départementale",current[0]+" -> "+department,actor);
        }
        if(!java.util.Objects.equals(current[1],manager)) career(id,"CHANGEMENT_MANAGER",LocalDate.now(),"Changement de manager",manager==null?"Manager retiré":"Nouveau manager : "+manager,actor);
        audit.record(actor,id,"UPDATE","EMPLOYEE_PROFILE");
        return employees.get(id,actor);
    }

    @Transactional
    public EmployeeProfileResponse addContract(int employeeId,CreateEmployeeContractRequest request,Authentication actor){
        access.requireHr(actor);
        employees.get(employeeId,actor);
        validateContract(request);
        LocalDate latest=jdbc.query("SELECT max(start_date) FROM employee_contracts WHERE employee_id=?",
                (rs,row)->rs.getObject(1,LocalDate.class),employeeId).getFirst();
        if(latest!=null&&!request.startDate().isAfter(latest)) throw new IllegalArgumentException("Un contrat successif doit commencer après le contrat précédent.");
        jdbc.update("UPDATE employee_contracts SET end_date=? WHERE employee_id=? AND end_date IS NULL",
                request.startDate().minusDays(1),employeeId);
        jdbc.update("""
                INSERT INTO employee_contracts(employee_id,contract_type,start_date,end_date,trial_period_end,
                    probation_renewal_date,grade,coefficient,job_title,work_regime,work_percentage,is_executive,
                    monthly_gross_salary,fixed_bonus,variable_bonus,company_vehicle,company_health_plan,meal_vouchers)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,employeeId,request.contractType(),request.startDate(),request.endDate(),request.trialPeriodEnd(),
                request.probationRenewalDate(),request.grade(),blank(request.coefficient()),request.jobTitle().trim(),
                request.workRegime(),pct(request.workPercentage()),Boolean.TRUE.equals(request.executive()),
                request.monthlyGrossSalary(),money(request.fixedBonus()),money(request.variableBonus()),
                Boolean.TRUE.equals(request.companyVehicle()),Boolean.TRUE.equals(request.companyHealthPlan()),Boolean.TRUE.equals(request.mealVouchers()));
        jdbc.update("UPDATE employees SET contract_type=?,monthly_salary=? WHERE id=?",request.contractType(),request.monthlyGrossSalary(),employeeId);
        career(employeeId,"AVENANT",request.startDate(),"Nouveau contrat / avenant",request.jobTitle()+" - "+request.grade(),actor);
        audit.record(actor,employeeId,"CREATE_CONTRACT","CONTRACT_AND_COMPENSATION");
        return employees.get(employeeId,actor);
    }

    public List<EmployeeCoreService.CareerEvent> career(int employeeId,Authentication actor){return employees.career(employeeId,actor);}

    @Transactional
    public EmployeeCoreService.CareerEvent addCareerEvent(int employeeId,CreateCareerEventRequest request,Authentication actor){
        access.requireHr(actor); employees.get(employeeId,actor);
        career(employeeId,request.type(),request.eventDate(),request.title(),request.description(),actor);
        audit.record(actor,employeeId,"CREATE","CAREER_HISTORY");
        return jdbc.query("SELECT id,event_type,event_date,title,description FROM employee_career_events WHERE employee_id=? ORDER BY id DESC LIMIT 1",
                (rs,row)->new EmployeeCoreService.CareerEvent(rs.getLong("id"),rs.getString("event_type"),rs.getObject("event_date",LocalDate.class),rs.getString("title"),rs.getString("description")),employeeId).getFirst();
    }

    public List<RetentionPolicy> retentionPolicies(Authentication actor){
        access.requireHr(actor);
        return jdbc.query("SELECT data_category,retention_days,updated_at FROM employee_retention_policies ORDER BY data_category",
                (rs,row)->new RetentionPolicy(rs.getString(1),rs.getInt(2),rs.getTimestamp(3).toInstant()));
    }

    @Transactional
    public RetentionPolicy setRetentionPolicy(RetentionPolicyRequest request,Authentication actor){
        access.requireHr(actor);
        if(!REQUIRED_RETENTION_CATEGORIES.contains(request.dataCategory())) throw new IllegalArgumentException("Catégorie de conservation non reconnue.");
        jdbc.update("""
                INSERT INTO employee_retention_policies(data_category,retention_days,updated_by,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)
                ON CONFLICT(data_category) DO UPDATE SET retention_days=EXCLUDED.retention_days,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP
                """,request.dataCategory(),request.retentionDays(),actor.getName());
        audit.record(actor,null,"UPDATE_RETENTION_POLICY","RETENTION_POLICY:"+request.dataCategory());
        return jdbc.query("SELECT data_category,retention_days,updated_at FROM employee_retention_policies WHERE data_category=?",
                (rs,row)->new RetentionPolicy(rs.getString(1),rs.getInt(2),rs.getTimestamp(3).toInstant()),request.dataCategory()).getFirst();
    }

    @Transactional
    public AnonymizationResult anonymizeLeaver(int employeeId,Authentication actor){
        access.requireHr(actor);
        var rows=jdbc.query("SELECT status,exit_date,anonymized_at,user_id FROM employees WHERE id=? FOR UPDATE",
                (rs,row)->new Object[]{rs.getString(1),rs.getObject(2,LocalDate.class),rs.getTimestamp(3),rs.getString(4)},employeeId);
        if(rows.isEmpty()) throw new ResourceNotFoundException("Employee not found.");
        Object[] employee=rows.getFirst();
        if(!"sorti".equals(employee[0])||employee[1]==null) throw new WorkflowConflictException("Only a leaver with an exit date can be anonymized.");
        var policies=jdbc.query("SELECT data_category,retention_days FROM employee_retention_policies",
                (rs,row)->new RetentionPolicyDays(rs.getString(1),rs.getInt(2)));
        if(policies.size()<REQUIRED_RETENTION_CATEGORIES.size()||!policies.stream().map(RetentionPolicyDays::category).collect(java.util.stream.Collectors.toSet()).containsAll(REQUIRED_RETENTION_CATEGORIES))
            throw new WorkflowConflictException("Configure retention durations for DOSSIER, DOCUMENTS, CONTRATS and CARRIERE first.");
        LocalDate exitDate=(LocalDate)employee[1];
        var eligibleCategories=new java.util.ArrayList<String>();
        for(RetentionPolicyDays policy:policies){
            if(REQUIRED_RETENTION_CATEGORIES.contains(policy.category())&&!exitDate.plusDays(policy.days()).isAfter(LocalDate.now()))
                eligibleCategories.add(policy.category());
        }
        if(eligibleCategories.contains("DOCUMENTS"))jdbc.update("DELETE FROM employee_documents WHERE employee_id=?",employeeId);
        if(eligibleCategories.contains("CONTRATS"))jdbc.update("DELETE FROM employee_contracts WHERE employee_id=?",employeeId);
        if(eligibleCategories.contains("CARRIERE"))jdbc.update("DELETE FROM employee_career_events WHERE employee_id=?",employeeId);
        boolean dossierAnonymized=employee[2]!=null;
        if(eligibleCategories.contains("DOSSIER")&&!dossierAnonymized){
            jdbc.update("DELETE FROM employee_change_requests WHERE employee_id=?",employeeId);
            String userId=(String)employee[3];
            if(userId!=null)jdbc.update("""
                    UPDATE users SET name='Anonymized employee account',email='employee-anon-'||id||'@invalid.local',password_hash=NULL,allowed_views='{}'
                    WHERE id=? AND role_type='Employee'
                    """,userId);
            jdbc.update("""
                    UPDATE employees SET user_id=NULL,source_candidate_id=NULL,matricule='ANON-'||id,first_name='Employee',last_name='Anonymized',
                        email_pro='employee-anon-'||id||'@invalid.local',email_perso=NULL,phone=NULL,birth_date='1900-01-01',
                        hire_date='1900-01-01',manager_id=NULL,contract_type='ANONYMISE',monthly_salary=0,
                        nationality=NULL,national_id_encrypted=NULL,rib_encrypted=NULL,address_street=NULL,address_city=NULL,address_zip=NULL,
                        emergency_contact_name=NULL,emergency_contact_phone=NULL,office_location=NULL,telework_days='{}',anonymized_at=CURRENT_TIMESTAMP
                    WHERE id=?
                    """,employeeId);
            dossierAnonymized=true;
        }
        audit.record(actor,employeeId,"ANONYMIZE","EMPLOYEE_RECORD");
        return new AnonymizationResult(employeeId,LocalDate.now(),List.copyOf(eligibleCategories),dossierAnonymized);
    }
    private LocalDate currentExitDate(int id){return jdbc.query("SELECT exit_date FROM employees WHERE id=?",(rs,row)->rs.getObject(1,LocalDate.class),id).getFirst();}
    private void validateContract(CreateEmployeeContractRequest r){
        if(!CONTRACT_TYPES.contains(r.contractType()))throw new IllegalArgumentException("Type de contrat non reconnu.");
        if(!r.grade().matches("G[1-8]"))throw new IllegalArgumentException("Le grade doit être compris entre G1 et G8.");
        if(!WORK_REGIMES.contains(r.workRegime()))throw new IllegalArgumentException("Régime de travail non reconnu.");
        if(r.endDate()!=null&&r.endDate().isBefore(r.startDate()))throw new IllegalArgumentException("La fin du contrat précède son début.");
        if(r.trialPeriodEnd()!=null&&r.trialPeriodEnd().isBefore(r.startDate()))throw new IllegalArgumentException("La période d’essai précède le contrat.");
        if(r.probationRenewalDate()!=null&&(r.trialPeriodEnd()==null||r.probationRenewalDate().isBefore(r.trialPeriodEnd())))throw new IllegalArgumentException("La date de renouvellement doit suivre la période d’essai initiale.");
        if(r.workPercentage()!=null&&r.workPercentage().compareTo(new BigDecimal("100"))>0)throw new IllegalArgumentException("Le temps de travail ne peut dépasser 100 %.");
    }
    private void career(int employeeId,String type,LocalDate date,String title,String description,Authentication actor){
        jdbc.update("INSERT INTO employee_career_events(employee_id,event_type,event_date,title,description,created_by) VALUES (?,?,?,?,?,?)",employeeId,type,date,title,description,actor.getName());
    }
    private BigDecimal pct(BigDecimal value){return value==null?new BigDecimal("100"):value;}
    private BigDecimal money(BigDecimal value){return value==null?BigDecimal.ZERO:value;}
    private String blank(String value){return value==null||value.isBlank()?null:value.trim();}
    public record RetentionPolicy(String dataCategory,int retentionDays,java.time.Instant updatedAt){ }
    private record RetentionPolicyDays(String category,int days){ }
    public record AnonymizationResult(int employeeId,LocalDate processedOn,List<String> categoriesProcessed,boolean dossierAnonymized){ }
}
