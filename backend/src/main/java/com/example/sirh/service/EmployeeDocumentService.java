package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class EmployeeDocumentService {
    private static final long MAX_BYTES = 8L * 1024 * 1024;
    private static final Set<String> DOCUMENT_TYPES = Set.of(
            "CNI", "TITRE_SEJOUR", "RIB", "PERMIS_CONDUIRE", "VISITE_MEDICALE", "DIPLOME", "CONTRAT_SIGNE");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");
    private final JdbcTemplate jdbc;
    private final EmployeeCoreService employees;
    private final EmployeeAccessService access;
    private final EmployeeGdprAuditService audit;
    private final NationalIdCryptoService crypto;

    public EmployeeDocumentService(JdbcTemplate jdbc, EmployeeCoreService employees, EmployeeAccessService access,
            EmployeeGdprAuditService audit, NationalIdCryptoService crypto) {
        this.jdbc = jdbc; this.employees = employees; this.access = access; this.audit = audit; this.crypto = crypto;
    }

    public List<DocumentRecord> list(int employeeId, Authentication actor) {
        requireDocumentAccess(employeeId, actor);
        audit.record(actor, employeeId, "READ", "DOCUMENT_METADATA");
        return jdbc.query("""
                SELECT id,document_type,filename,mime_type,file_size_bytes,expiration_date,verification_status,
                       verification_note,created_at,verified_at,
                       CASE WHEN expiration_date < CURRENT_DATE THEN 'expire'
                            WHEN expiration_date <= CURRENT_DATE + 30 THEN 'expire_bientot'
                            WHEN verification_status='valide' THEN 'valide'
                            ELSE verification_status END AS validity
                FROM employee_documents WHERE employee_id=? ORDER BY expiration_date NULLS LAST,created_at DESC,id DESC
                """, (rs, row) -> new DocumentRecord(rs.getInt("id"), employeeId, rs.getString("document_type"),
                rs.getString("filename"), rs.getString("mime_type"), rs.getLong("file_size_bytes"),
                rs.getObject("expiration_date", LocalDate.class), rs.getString("verification_status"),
                rs.getString("verification_note"), rs.getString("validity"), rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("verified_at") == null ? null : rs.getTimestamp("verified_at").toInstant()), employeeId);
    }

    @Transactional
    public DocumentRecord upload(int employeeId, String type, LocalDate expirationDate, MultipartFile file,
            Authentication actor) {
        boolean self = isSelf(employeeId, actor);
        if (!access.isHr(actor) && !(access.isEmployee(actor) && self))
            throw new ForbiddenOperationException("Le dépôt de documents est réservé au salarié concerné et aux RH.");
        employees.get(employeeId, actor);
        if (!DOCUMENT_TYPES.contains(type)) throw new IllegalArgumentException("Type de document non reconnu.");
        if ("TITRE_SEJOUR".equals(type) && expirationDate == null)
            throw new IllegalArgumentException("La date d’expiration du titre de séjour est obligatoire.");
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES)
            throw new IllegalArgumentException("Le fichier doit faire entre 1 octet et 8 Mo.");
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType) || !matchesSignature(mimeType, read(file)))
            throw new IllegalArgumentException("Seuls les fichiers PDF, JPEG ou PNG valides sont acceptés.");
        byte[] encrypted = crypto.encryptBytes(read(file));
        String filename = safeFilename(file.getOriginalFilename());
        Integer id = jdbc.queryForObject("""
                INSERT INTO employee_documents(employee_id,document_type,file_url,filename,mime_type,file_size_bytes,
                    encrypted_content,expiration_date,verification_status,uploaded_by)
                VALUES (?,?, 'encrypted-db',?,?,?,?,?,'en_attente',?) RETURNING id
                """, Integer.class, employeeId, type, filename, mimeType, file.getSize(), encrypted,
                expirationDate, actor.getName());
        audit.record(actor, employeeId, "UPLOAD", "EMPLOYEE_DOCUMENT:" + type);
        return list(employeeId, actor).stream().filter(document -> document.id() == id).findFirst()
                .orElseThrow(() -> new IllegalStateException("Le document téléversé n’a pas été relu."));
    }

    public DocumentContent download(int employeeId, int documentId, Authentication actor) {
        requireDocumentAccess(employeeId, actor);
        var rows = jdbc.query("""
                SELECT encrypted_content,document_type,filename,mime_type FROM employee_documents WHERE id=? AND employee_id=?
                """, (rs, row) -> new Object[] { rs.getBytes("encrypted_content"), rs.getString("document_type"),
                        rs.getString("filename"), rs.getString("mime_type") },
                documentId, employeeId);
        if (rows.isEmpty()) throw new ResourceNotFoundException("Document introuvable.");
        Object[] row = rows.getFirst();
        if (row[0] == null) throw new WorkflowConflictException("Ce document ancien ne possède pas de contenu chiffré téléchargeable.");
        audit.record(actor, employeeId, "DOWNLOAD", "EMPLOYEE_DOCUMENT:" + row[1]);
        return new DocumentContent((String) row[2], (String) row[3], crypto.decryptBytes((byte[]) row[0]));
    }

    @Transactional
    public DocumentRecord verify(int employeeId, int documentId, String status, String note, Authentication actor) {
        access.requireHr(actor);
        if (!Set.of("valide", "rejete").contains(status))
            throw new IllegalArgumentException("Le statut de vérification doit être valide ou rejete.");
        int updated = jdbc.update("""
                UPDATE employee_documents SET verification_status=?,verification_note=?,verified_by=?,verified_at=CURRENT_TIMESTAMP,
                    updated_at=CURRENT_TIMESTAMP WHERE id=? AND employee_id=?
                """, status, blankToNull(note), actor.getName(), documentId, employeeId);
        if (updated != 1) throw new ResourceNotFoundException("Document introuvable.");
        audit.record(actor, employeeId, "VERIFY", "EMPLOYEE_DOCUMENT");
        return list(employeeId, actor).stream().filter(document -> document.id() == documentId).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Document introuvable."));
    }

    public List<ExpiryNotification> notifications(Authentication actor) {
        if (!access.isHr(actor) && !access.isDirection(actor))
            throw new ForbiddenOperationException("Les alertes d’expiration sont réservées aux RH et à la Direction.");
        var notifications=jdbc.query("""
                SELECT n.id,n.document_id,n.employee_id,d.document_type,d.filename,e.first_name,e.last_name,
                       n.expiration_date,n.days_before,n.emitted_at
                FROM employee_document_expiry_notifications n
                JOIN employee_documents d ON d.id=n.document_id JOIN employees e ON e.id=n.employee_id
                WHERE n.expiration_date=d.expiration_date
                ORDER BY n.emitted_at DESC LIMIT 200
                """, (rs, row) -> new ExpiryNotification(rs.getLong("id"), rs.getInt("document_id"),
                rs.getInt("employee_id"), rs.getString("document_type"), rs.getString("filename"),
                rs.getString("first_name"), rs.getString("last_name"), rs.getObject("expiration_date", LocalDate.class),
                rs.getInt("days_before"), rs.getTimestamp("emitted_at").toInstant()));
        notifications.forEach(n->audit.record(actor,n.employeeId(),"READ","DOCUMENT_EXPIRY_ALERT"));
        return notifications;
    }

    @Scheduled(cron = "${sirh.documents.expiry-cron:0 0 7 * * *}")
    @Transactional
    public void checkDocumentExpirations() {
        jdbc.update("""
                INSERT INTO gdpr_access_audit(actor_user_id,employee_id,action,data_category)
                SELECT NULL,employee_id,'SYSTEM_EXPIRE','EMPLOYEE_DOCUMENT'
                FROM employee_documents WHERE expiration_date<CURRENT_DATE AND verification_status NOT IN ('rejete','expire')
                """);
        jdbc.update("UPDATE employee_documents SET verification_status='expire',updated_at=CURRENT_TIMESTAMP WHERE expiration_date<CURRENT_DATE AND verification_status<>'rejete'");
        for (int days : List.of(30, 7, 0)) {
            jdbc.update("""
                INSERT INTO employee_document_expiry_notifications(document_id,employee_id,expiration_date,days_before)
                SELECT d.id,d.employee_id,d.expiration_date,? FROM employee_documents d
                    WHERE d.expiration_date=CURRENT_DATE+? AND d.verification_status<>'rejete'
                ON CONFLICT(document_id,expiration_date,days_before) DO NOTHING
                """, days, days);
        }
    }

    private void requireDocumentAccess(int employeeId, Authentication actor) {
        if (access.isHr(actor) || access.isDirection(actor)) { employees.get(employeeId, actor); return; }
        if (access.isEmployee(actor) && isSelf(employeeId, actor)) { employees.get(employeeId, actor); return; }
        throw new ForbiddenOperationException("Accès aux documents salariés refusé.");
    }

    private boolean isSelf(int employeeId, Authentication actor) {
        return access.isEmployee(actor) && jdbc.queryForObject(
                "SELECT count(*) FROM employees WHERE id=? AND user_id=?", Integer.class, employeeId, actor.getName()) > 0;
    }

    private byte[] read(MultipartFile file) {
        try { return file.getBytes(); }
        catch (IOException exception) { throw new IllegalArgumentException("Lecture du fichier téléversé impossible.", exception); }
    }

    private boolean matchesSignature(String mime, byte[] data) {
        if ("application/pdf".equals(mime)) return data.length >= 5 && data[0]=='%' && data[1]=='P' && data[2]=='D' && data[3]=='F' && data[4]=='-';
        if ("image/jpeg".equals(mime)) return data.length >= 3 && (data[0]&255)==0xff && (data[1]&255)==0xd8 && (data[2]&255)==0xff;
        return data.length >= 8 && (data[0]&255)==0x89 && data[1]=='P' && data[2]=='N' && data[3]=='G'
                && (data[4]&255)==0x0d && (data[5]&255)==0x0a && (data[6]&255)==0x1a && (data[7]&255)==0x0a;
    }

    private String safeFilename(String filename) {
        String safe = filename == null ? "document" : filename.replace('\\', '/').substring(filename.replace('\\', '/').lastIndexOf('/') + 1);
        safe = safe.replaceAll("[^A-Za-z0-9._ -]", "_").trim();
        return safe.isEmpty() ? "document" : safe.substring(0, Math.min(255, safe.length()));
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public record DocumentRecord(int id, int employeeId, String documentType, String filename, String mimeType,
            long fileSizeBytes, LocalDate expirationDate, String verificationStatus, String verificationNote,
            String validity, java.time.Instant uploadedAt, java.time.Instant verifiedAt) { }
    public record ExpiryNotification(long id, int documentId, int employeeId, String documentType, String filename,
            String firstName, String lastName, LocalDate expirationDate, int daysBefore, java.time.Instant emittedAt) { }
    public record DocumentContent(String filename, String mimeType, byte[] content) { }
}
