package com.example.sirh.service;

import com.example.sirh.dto.ConvertCandidateToEmployeeRequest;
import com.example.sirh.dto.EmployeeProfileResponse;
import com.example.sirh.dto.PageResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeeCoreService {
    private final JdbcTemplate jdbc;
    private final EmployeeAccessService access;
    private final EmployeeGdprAuditService audit;
    private final NationalIdCryptoService crypto;

    public EmployeeCoreService(JdbcTemplate jdbc, EmployeeAccessService access,
            EmployeeGdprAuditService audit, NationalIdCryptoService crypto) {
        this.jdbc = jdbc;
        this.access = access;
        this.audit = audit;
        this.crypto = crypto;
    }

    public PageResponse<EmployeeProfileResponse> list(String departmentId, String search,String status,String contractType,
            String grade,String managerId,int page,int size,Authentication actor) {
        access.requireProfileRead(actor);
        if (departmentId != null && !departmentId.isBlank()) access.requireDepartmentScope(actor, departmentId);
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        var params = new java.util.ArrayList<Object>();
        if (departmentId != null && !departmentId.isBlank()) {
            where.append(" AND e.department_id=?"); params.add(departmentId);
        }
        if (access.isManager(actor)) {
            where.append(" AND EXISTS (SELECT 1 FROM manager_departments md WHERE md.manager_id=? AND md.department_id=e.department_id)");
            params.add(actor.getName());
        }
        if (access.isEmployee(actor)) {
            where.append(" AND e.user_id=?"); params.add(actor.getName());
        }
        if (search != null && !search.isBlank()) {
            where.append(" AND lower(concat_ws(' ',e.first_name,e.last_name,e.matricule,e.email_pro,c.job_title,d.name,e.office_location,array_to_string(e.skills,' '))) LIKE lower(?)");
            params.add("%" + search.trim() + "%");
        }
        addFilter(where,params,"e.status",status);
        addFilter(where,params,"e.contract_type",contractType);
        addFilter(where,params,"c.grade",grade);
        addFilter(where,params,"e.manager_id",managerId);
        int safeSize=Math.max(1,Math.min(size,100)); int safePage=Math.max(page,0);
        String from=" FROM employees e JOIN departments d ON d.id=e.department_id LEFT JOIN users m ON m.id=e.manager_id LEFT JOIN LATERAL (SELECT * FROM employee_contracts ec WHERE ec.employee_id=e.id ORDER BY ec.start_date DESC,ec.id DESC LIMIT 1) c ON TRUE ";
        Long total=jdbc.queryForObject("SELECT count(*)"+from+where,Long.class,params.toArray());
        var queryParams=new java.util.ArrayList<>(params); queryParams.add(safeSize); queryParams.add((long)safePage*safeSize);
        var profiles=jdbc.query(profileSelect()+where+" ORDER BY e.last_name,e.first_name LIMIT ? OFFSET ?",
                (rs,row)->mapProfile(rs,actor,false),queryParams.toArray());
        long count=total==null?0:total;
        return new PageResponse<>(profiles,safePage,safeSize,count,(int)Math.ceil((double)count/safeSize));
    }

    private void addFilter(StringBuilder where,List<Object> params,String column,String value){if(value!=null&&!value.isBlank()){where.append(" AND ").append(column).append("=?");params.add(value.trim());}}

    public EmployeeProfileResponse get(int employeeId, Authentication actor) {
        access.requireProfileRead(actor);
        var identity = jdbc.query("SELECT department_id,user_id FROM employees WHERE id=?",
                (rs, row) -> new String[] { rs.getString("department_id"), rs.getString("user_id") }, employeeId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found."));
        access.requireDepartmentScope(actor, identity[0]);
        if (access.isEmployee(actor) && !actor.getName().equals(identity[1]))
            throw new ForbiddenOperationException("Employees may only access their own profile.");
        var profile = jdbc.query(profileSelect() + " WHERE e.id=?", (rs, row) -> mapProfile(rs, actor, true), employeeId)
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Salarié introuvable."));
        return profile;
    }

    public String revealNationalId(int employeeId, Authentication actor) {
        access.requireHr(actor);
        var rows=jdbc.query("SELECT national_id_encrypted FROM employees WHERE id=?",
                (rs,row)->rs.getString(1),employeeId);
        if(rows.isEmpty())throw new ResourceNotFoundException("Salarié introuvable.");
        audit.record(actor,employeeId,"REVEAL","NATIONAL_ID");
        return crypto.decrypt(rows.getFirst());
    }

    public List<ManagerOption> managers(String departmentId, Authentication actor) {
        access.requireHr(actor);
        if (departmentId == null || departmentId.isBlank()) throw new IllegalArgumentException("Choisissez d’abord un département.");
        return jdbc.query("""
                SELECT u.id,u.name,u.role_display_name,d.id AS department_id,d.name AS department_name,
                       (SELECT count(*) FROM employees e WHERE e.manager_id=u.id AND e.department_id=d.id AND e.status='actif') AS team_size
                FROM manager_departments md
                JOIN users u ON u.id=md.manager_id
                JOIN departments d ON d.id=md.department_id
                WHERE md.department_id=? AND u.role_type='Manager'
                ORDER BY u.name
                """, (rs, row) -> new ManagerOption(rs.getString("id"), rs.getString("name"),
                rs.getString("role_display_name"), rs.getString("department_id"),
                rs.getString("department_name"), rs.getInt("team_size")), departmentId);
    }

    public List<ManagerOption> managerDirectory(Authentication actor) {
        access.requireHr(actor);
        return jdbc.query("""
                SELECT u.id,u.name,u.role_display_name,d.id AS department_id,d.name AS department_name,
                       (SELECT count(*) FROM employees e WHERE e.manager_id=u.id AND e.department_id=d.id AND e.status='actif') AS team_size
                FROM manager_departments md JOIN users u ON u.id=md.manager_id JOIN departments d ON d.id=md.department_id
                WHERE u.role_type='Manager' ORDER BY d.name,u.name
                """,(rs,row)->new ManagerOption(rs.getString("id"),rs.getString("name"),rs.getString("role_display_name"),
                rs.getString("department_id"),rs.getString("department_name"),rs.getInt("team_size")));
    }

    @Transactional
    public EmployeeProfileResponse createFromCandidate(String candidateId, ConvertCandidateToEmployeeRequest request,
            Authentication actor) {
        access.requireHr(actor);
        if (request.contractEndDate() != null && request.contractEndDate().isBefore(request.hireDate()))
            throw new IllegalArgumentException("La fin du contrat doit être postérieure ou égale à sa date de début.");
        if (request.trialPeriodEnd() != null && request.trialPeriodEnd().isBefore(request.hireDate()))
            throw new IllegalArgumentException("La fin de période d’essai doit être postérieure ou égale à l’embauche.");
        if (request.workPercentage() != null && request.workPercentage().compareTo(new java.math.BigDecimal("100")) > 0)
            throw new IllegalArgumentException("Le temps de travail ne peut pas dépasser 100 %.");
        if (!request.grade().matches("G[1-8]")) throw new IllegalArgumentException("Le grade doit être compris entre G1 et G8.");
        if (!List.of("FORFAIT_JOURS_218", "HEBDO_35H", "HEBDO_39H").contains(request.workRegime()))
            throw new IllegalArgumentException("Régime de travail non reconnu.");

        jdbc.execute("SELECT pg_advisory_xact_lock(8315055)");
        var candidates = jdbc.queryForList("""
                SELECT c.id,c.kanban_stage,c.position_id,p.department_id,p.status AS position_status
                FROM candidates c LEFT JOIN available_positions p ON p.id=c.position_id
                WHERE c.id=? FOR UPDATE OF c
                """, candidateId);
        if (candidates.isEmpty()) throw new ResourceNotFoundException("Candidat introuvable.");
        var candidate = candidates.getFirst();
        if (!"retenu".equals(candidate.get("kanban_stage")))
            throw new WorkflowConflictException("Seul un candidat retenu peut devenir salarié.");
        if (candidate.get("position_id") == null || !request.departmentId().equals(candidate.get("department_id")))
            throw new WorkflowConflictException("Le candidat doit être rattaché à un poste du département choisi.");
        var positionRows = jdbc.queryForList("SELECT status FROM available_positions WHERE id=? FOR UPDATE", candidate.get("position_id"));
        if (positionRows.isEmpty()) throw new WorkflowConflictException("Position no longer exists.");
        candidate.put("position_status", positionRows.getFirst().get("status"));
        if (!"ouvert".equals(candidate.get("position_status")))
            throw new WorkflowConflictException("Le poste associé doit être publié et ouvert avant l’embauche.");
        access.requireDepartmentScope(actor, request.departmentId());
        if (jdbc.queryForObject("SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?",
                Integer.class, request.managerId(), request.departmentId()) == 0)
            throw new IllegalArgumentException("Le manager sélectionné ne supervise pas ce département.");
        if (jdbc.queryForObject("SELECT count(*) FROM employees WHERE source_candidate_id=?", Integer.class, candidateId) > 0)
            throw new WorkflowConflictException("Ce candidat a déjà été converti en salarié.");

        Integer sequence = jdbc.queryForObject("""
                SELECT COALESCE(MAX(substring(matricule FROM '[0-9]+$')::integer),0)+1
                FROM employees WHERE matricule LIKE ?
                """, Integer.class, "EMP-" + LocalDate.now().getYear() + "-%");
        String matricule = "EMP-" + LocalDate.now().getYear() + "-" + String.format("%04d", sequence);
        String encryptedNationalId = crypto.encrypt(request.nationalId());
        Integer employeeId = jdbc.queryForObject("""
                INSERT INTO employees(source_candidate_id,matricule,first_name,last_name,email_pro,email_perso,phone,birth_date,hire_date,
                    department_id,manager_id,contract_type,monthly_salary,status,nationality,national_id_encrypted,
                    address_street,address_city,address_zip,emergency_contact_name,emergency_contact_phone,office_location,skills)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'actif',?,?,?,?,?,?,?,?,(SELECT COALESCE(skills,'{}') FROM candidates WHERE id=?)) RETURNING id
                """, Integer.class, candidateId, matricule, request.firstName().trim(), request.lastName().trim(),
                request.emailPro().trim().toLowerCase(), blankToNull(request.personalEmail()), blankToNull(request.phone()), request.birthDate(), request.hireDate(),
                request.departmentId(), request.managerId(), request.contractType(), request.monthlySalary(),
                blankToNull(request.nationality()), encryptedNationalId, blankToNull(request.addressStreet()),
                blankToNull(request.addressCity()), blankToNull(request.addressZip()),
                blankToNull(request.emergencyContactName()), blankToNull(request.emergencyContactPhone()), blankToNull(request.officeLocation()),candidateId);
        jdbc.update("""
                INSERT INTO employee_contracts(employee_id,contract_type,start_date,end_date,trial_period_end,grade,
                    probation_renewal_date,coefficient,job_title,work_regime,work_percentage,is_executive,monthly_gross_salary,
                    fixed_bonus,variable_bonus,company_vehicle,company_health_plan,meal_vouchers)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, employeeId, request.contractType(), request.hireDate(), request.contractEndDate(),
                request.trialPeriodEnd(), request.grade(), null, blankToNull(request.coefficient()), request.jobTitle(), request.workRegime(),
                request.workPercentage() == null ? new java.math.BigDecimal("100") : request.workPercentage(),
                Boolean.TRUE.equals(request.executive()), request.monthlySalary(), request.fixedBonus()==null?java.math.BigDecimal.ZERO:request.fixedBonus(),
                request.variableBonus()==null?java.math.BigDecimal.ZERO:request.variableBonus(),Boolean.TRUE.equals(request.companyVehicle()),
                Boolean.TRUE.equals(request.companyHealthPlan()),Boolean.TRUE.equals(request.mealVouchers()));
        jdbc.update("UPDATE departments SET headcount_current=headcount_current+1 WHERE id=?", request.departmentId());
        int positionUpdated = jdbc.update("UPDATE available_positions SET status='pourvu',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='ouvert'",
                candidate.get("position_id"));
        if (positionUpdated != 1) throw new WorkflowConflictException("Position is no longer open.");
        jdbc.update("""
                INSERT INTO employee_career_events(employee_id,event_type,event_date,title,description,created_by)
                VALUES (?,'EMBAUCHE',?,'Embauche depuis le vivier de recrutement',?,?)
                """, employeeId, request.hireDate(), "Candidat " + candidateId + " recruté.", actor.getName());
        audit.record(actor, employeeId, "CREATE_FROM_CANDIDATE", "EMPLOYMENT_RECORD");
        return get(employeeId, actor);
    }

    public List<CareerEvent> career(int employeeId, Authentication actor) {
        get(employeeId, actor);
        audit.record(actor, employeeId, "READ", "CAREER_HISTORY");
        return jdbc.query("""
                SELECT id,event_type,event_date,title,description FROM employee_career_events
                WHERE employee_id=? AND (?=false OR event_type NOT IN ('CHANGEMENT_SALAIRE')) ORDER BY event_date DESC,id DESC
                """, (rs, row) -> new CareerEvent(rs.getLong("id"), rs.getString("event_type"),
                rs.getObject("event_date", LocalDate.class), rs.getString("title"),
                access.isManager(actor)?null:rs.getString("description")), employeeId,access.isManager(actor));
    }

    public List<ContractRecord> contracts(int employeeId, Authentication actor) {
        get(employeeId, actor);
        audit.record(actor, employeeId, "READ", "CONTRACT_HISTORY");
        boolean manager = access.isManager(actor);
        return jdbc.query("""
                SELECT id,contract_type,start_date,end_date,trial_period_end,probation_renewal_date,grade,coefficient,job_title,
                       work_regime,work_percentage,is_executive,monthly_gross_salary,fixed_bonus,variable_bonus,
                       company_vehicle,company_health_plan,meal_vouchers
                FROM employee_contracts WHERE employee_id=? ORDER BY start_date DESC,id DESC
                """, (rs, row) -> new ContractRecord(rs.getLong("id"), rs.getString("contract_type"),
                rs.getObject("start_date", LocalDate.class), rs.getObject("end_date", LocalDate.class),
                rs.getObject("trial_period_end", LocalDate.class), rs.getString("grade"),
                rs.getString("coefficient"), rs.getString("job_title"), rs.getString("work_regime"),
                rs.getBigDecimal("work_percentage"), rs.getBoolean("is_executive"),
                manager ? null : rs.getBigDecimal("monthly_gross_salary"),
                rs.getObject("probation_renewal_date",LocalDate.class),
                manager?null:rs.getBigDecimal("fixed_bonus"),manager?null:rs.getBigDecimal("variable_bonus"),
                manager?null:rs.getObject("company_vehicle",Boolean.class),
                manager?null:rs.getObject("company_health_plan",Boolean.class),
                manager?null:rs.getObject("meal_vouchers",Boolean.class)), employeeId);
    }

    private String profileSelect() {
        return """
                SELECT e.id,e.user_id,e.matricule,e.first_name,e.last_name,e.email_pro,e.phone,e.birth_date,e.hire_date,
                    e.department_id,d.name AS department_name,e.manager_id,m.name AS manager_name,e.contract_type,
                    e.monthly_salary,e.status,e.nationality,e.national_id_encrypted,e.address_street,e.address_city,
                e.address_zip,e.emergency_contact_name,e.emergency_contact_phone,e.email_perso,e.rib_encrypted,e.skills,
                    e.office_location,e.telework_days,e.exit_date,e.anonymized_at,c.grade,c.job_title,c.work_regime,
                    c.work_percentage,c.trial_period_end,c.end_date AS contract_end_date,c.coefficient,c.fixed_bonus,
                    c.variable_bonus,c.company_vehicle,c.company_health_plan,c.meal_vouchers,c.is_executive
                FROM employees e
                JOIN departments d ON d.id=e.department_id
                LEFT JOIN users m ON m.id=e.manager_id
                LEFT JOIN LATERAL (SELECT * FROM employee_contracts ec WHERE ec.employee_id=e.id
                    ORDER BY ec.start_date DESC,ec.id DESC LIMIT 1) c ON TRUE
                """;
    }

    private EmployeeProfileResponse mapProfile(ResultSet rs, Authentication actor, boolean detailed) throws SQLException {
        boolean hr = access.isHr(actor);
        boolean manager = access.isManager(actor);
        boolean self = access.isEmployee(actor) && actor.getName().equals(rs.getString("user_id"));
        String category = (hr || access.isDirection(actor)) && detailed ? "SENSITIVE_PROFILE" : self ? "OWN_PROFILE" : manager ? "PROFESSIONAL_DATA" : "EMPLOYEE_DIRECTORY";
        audit.record(actor, rs.getInt("id"), "READ", category);
        String nationalId = null;
        String encryptedIban=(hr||self)&&detailed?rs.getString("rib_encrypted"):null;
        String iban=encryptedIban==null?null:crypto.decrypt(encryptedIban);
        String ibanMasked=iban==null||iban.length()<4?null:"•••• •••• •••• "+iban.substring(iban.length()-4);
        java.sql.Array teleworkArray=rs.getArray("telework_days");
        List<String> teleworkDays=teleworkArray==null?List.of():java.util.Arrays.asList((String[])teleworkArray.getArray());
        return new EmployeeProfileResponse(rs.getInt("id"), rs.getString("matricule"), rs.getString("first_name"),
                rs.getString("last_name"), rs.getString("email_pro"), rs.getString("phone"),
                rs.getObject("birth_date", LocalDate.class), rs.getObject("hire_date", LocalDate.class),
                rs.getString("department_id"), rs.getString("department_name"), rs.getString("manager_id"),
                rs.getString("manager_name"), rs.getString("contract_type"), rs.getString("grade"),
                rs.getString("job_title"), rs.getString("work_regime"), rs.getBigDecimal("work_percentage"),
                (manager && !self) || (!detailed && !self) ? null : rs.getBigDecimal("monthly_salary"), rs.getString("status"),
                (hr && detailed) || self ? rs.getString("nationality") : null, nationalId,
                (hr && detailed) || self ? rs.getString("address_street") : null, (hr && detailed) || self ? rs.getString("address_city") : null,
                (hr && detailed) || self ? rs.getString("address_zip") : null, (hr && detailed) || self ? rs.getString("emergency_contact_name") : null,
                (hr && detailed) || self ? rs.getString("emergency_contact_phone") : null,
                rs.getObject("trial_period_end", LocalDate.class), rs.getObject("contract_end_date", LocalDate.class),
                (hr&&detailed)||self?rs.getString("email_perso"):null,rs.getString("office_location"),teleworkDays,
                rs.getObject("exit_date",LocalDate.class),rs.getTimestamp("anonymized_at")!=null,rs.getString("coefficient"),
                manager&&!self?null:rs.getBigDecimal("fixed_bonus"),manager&&!self?null:rs.getBigDecimal("variable_bonus"),
                manager&&!self?null:rs.getObject("company_vehicle",Boolean.class),manager&&!self?null:rs.getObject("company_health_plan",Boolean.class),
                manager&&!self?null:rs.getObject("meal_vouchers",Boolean.class),(hr||self)&&detailed?ibanMasked:null,
                rs.getArray("skills")==null?List.of():java.util.Arrays.asList((String[])rs.getArray("skills").getArray()),
                rs.getObject("is_executive",Boolean.class));
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public record ManagerOption(String id, String name, String role, String departmentId, String departmentName, int teamSize) { }
    public record CareerEvent(long id, String type, LocalDate eventDate, String title, String description) { }
    public record ContractRecord(long id, String contractType, LocalDate startDate, LocalDate endDate,
            LocalDate trialPeriodEnd, String grade, String coefficient, String jobTitle, String workRegime,
            java.math.BigDecimal workPercentage, boolean executive, java.math.BigDecimal monthlyGrossSalary,
            LocalDate probationRenewalDate,java.math.BigDecimal fixedBonus,java.math.BigDecimal variableBonus,
            Boolean companyVehicle,Boolean companyHealthPlan,Boolean mealVouchers) { }
}
