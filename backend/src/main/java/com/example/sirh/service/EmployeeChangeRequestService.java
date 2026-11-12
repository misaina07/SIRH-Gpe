package com.example.sirh.service;

import com.example.sirh.dto.EmployeePersonalChangeRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeChangeRequestService {
    private final JdbcTemplate jdbc;
    private final EmployeeAccessService access;
    private final EmployeeGdprAuditService audit;
    private final NationalIdCryptoService crypto;

    public EmployeeChangeRequestService(JdbcTemplate jdbc, EmployeeAccessService access,
            EmployeeGdprAuditService audit, NationalIdCryptoService crypto) {
        this.jdbc=jdbc; this.access=access; this.audit=audit; this.crypto=crypto;
    }

    @Transactional
    public ChangeRequestRecord submit(int employeeId, EmployeePersonalChangeRequest request, Authentication actor) {
        if (!access.isEmployee(actor) || jdbc.queryForObject("SELECT count(*) FROM employees WHERE id=? AND user_id=?",
                Integer.class, employeeId, actor.getName()) == 0)
            throw new ForbiddenOperationException("Seul le salarié concerné peut demander la modification de ses coordonnées.");
        if (empty(request)) throw new IllegalArgumentException("Indiquez au moins une coordonnée à modifier.");
        long id = jdbc.queryForObject("""
                INSERT INTO employee_change_requests(employee_id,requested_by,encrypted_payload)
                VALUES (?,?,?) RETURNING id
                """, Long.class, employeeId, actor.getName(), crypto.encrypt(serialize(request)));
        audit.record(actor, employeeId, "SUBMIT_CHANGE", request.iban()==null ? "PERSONAL_CONTACT" : "PERSONAL_CONTACT_AND_RIB");
        return new ChangeRequestRecord(id, employeeId, "en_attente", null, java.time.Instant.now(), null,
                request.personalEmail(), request.phone(), request.addressStreet(), request.addressCity(), request.addressZip(),
                request.emergencyContactName(), request.emergencyContactPhone(), mask(request.iban()));
    }

    public List<ChangeRequestRecord> pending(Authentication actor) {
        access.requireHr(actor);
        var rows = jdbc.query("""
                SELECT id,employee_id,encrypted_payload,created_at FROM employee_change_requests
                WHERE status='en_attente' ORDER BY created_at,id
                """, (rs,row) -> new Object[]{rs.getLong("id"),rs.getInt("employee_id"),
                rs.getString("encrypted_payload"),rs.getTimestamp("created_at").toInstant()});
        return rows.stream().map(row -> {
            audit.record(actor,(int)row[1],"READ","EMPLOYEE_CHANGE_REQUEST");
            EmployeePersonalChangeRequest p=deserialize(crypto.decrypt((String)row[2]));
            return new ChangeRequestRecord((long)row[0],(int)row[1],"en_attente",null,(java.time.Instant)row[3],null,
                    p.personalEmail(),p.phone(),p.addressStreet(),p.addressCity(),p.addressZip(),
                    p.emergencyContactName(),p.emergencyContactPhone(),mask(p.iban()));
        }).toList();
    }

    @Transactional
    public ChangeRequestRecord review(long requestId, boolean approve, String note, Authentication actor) {
        access.requireHr(actor);
        var rows=jdbc.query("""
                SELECT employee_id,encrypted_payload,status,created_at FROM employee_change_requests WHERE id=? FOR UPDATE
                """,(rs,row)->new Object[]{rs.getInt("employee_id"),rs.getString("encrypted_payload"),
                rs.getString("status"),rs.getTimestamp("created_at").toInstant()},requestId);
        if(rows.isEmpty()) throw new ResourceNotFoundException("Demande de modification introuvable.");
        Object[] row=rows.getFirst();
        if(!"en_attente".equals(row[2])) throw new WorkflowConflictException("Cette demande a déjà été traitée.");
        int employeeId=(int)row[0];
        EmployeePersonalChangeRequest p=deserialize(crypto.decrypt((String)row[1]));
        if(approve){
            String encryptedIban=crypto.encrypt(p.iban());
            jdbc.update("""
                    UPDATE employees SET email_perso=COALESCE(?,email_perso),phone=COALESCE(?,phone),
                        address_street=COALESCE(?,address_street),address_city=COALESCE(?,address_city),
                        address_zip=COALESCE(?,address_zip),emergency_contact_name=COALESCE(?,emergency_contact_name),
                        emergency_contact_phone=COALESCE(?,emergency_contact_phone),rib_encrypted=COALESCE(?,rib_encrypted)
                    WHERE id=?
                    """,blank(p.personalEmail()),blank(p.phone()),blank(p.addressStreet()),blank(p.addressCity()),
                    blank(p.addressZip()),blank(p.emergencyContactName()),blank(p.emergencyContactPhone()),encryptedIban,employeeId);
        }
        String status=approve?"approuvee":"refusee";
        jdbc.update("""
                UPDATE employee_change_requests SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,decision_note=? WHERE id=?
                """,status,actor.getName(),blank(note),requestId);
        audit.record(actor,employeeId,approve?"APPROVE_CHANGE":"REJECT_CHANGE",p.iban()==null?"PERSONAL_CONTACT":"PERSONAL_CONTACT_AND_RIB");
        return new ChangeRequestRecord(requestId,employeeId,status,actor.getName(),(java.time.Instant)row[3],blank(note),
                p.personalEmail(),p.phone(),p.addressStreet(),p.addressCity(),p.addressZip(),
                p.emergencyContactName(),p.emergencyContactPhone(),mask(p.iban()));
    }

    private boolean empty(EmployeePersonalChangeRequest p){return p.personalEmail()==null&&p.phone()==null&&p.addressStreet()==null&&p.addressCity()==null&&p.addressZip()==null&&p.emergencyContactName()==null&&p.emergencyContactPhone()==null&&p.iban()==null;}
    private String serialize(EmployeePersonalChangeRequest p){
        return String.join(".",java.util.stream.Stream.of(p.personalEmail(),p.phone(),p.addressStreet(),p.addressCity(),p.addressZip(),p.emergencyContactName(),p.emergencyContactPhone(),p.iban())
                .map(value->value==null?"":java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(java.nio.charset.StandardCharsets.UTF_8))).toList());
    }
    private EmployeePersonalChangeRequest deserialize(String encoded){
        String[] parts=encoded.split("\\.",-1);if(parts.length!=8)throw new IllegalStateException("Protected request payload is invalid.");
        String[] values=java.util.Arrays.stream(parts).map(value->value.isEmpty()?null:new String(java.util.Base64.getUrlDecoder().decode(value),java.nio.charset.StandardCharsets.UTF_8)).toArray(String[]::new);
        return new EmployeePersonalChangeRequest(values[0],values[1],values[2],values[3],values[4],values[5],values[6],values[7]);
    }
    private String mask(String iban){if(iban==null||iban.isBlank())return null;return "•••• •••• •••• "+iban.substring(Math.max(0,iban.length()-4));}
    private String blank(String value){return value==null||value.isBlank()?null:value.trim();}

    public record ChangeRequestRecord(long id,int employeeId,String status,String reviewedBy,java.time.Instant createdAt,
            String decisionNote,String personalEmail,String phone,String addressStreet,String addressCity,String addressZip,
            String emergencyContactName,String emergencyContactPhone,String ibanMasked){ }
}
