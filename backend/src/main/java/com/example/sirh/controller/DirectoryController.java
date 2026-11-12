package com.example.sirh.controller;

import com.example.sirh.service.DirectoryService;
import com.example.sirh.service.ResourceNotFoundException;
import com.example.sirh.dto.CreateRequisitionRequest;
import com.example.sirh.dto.FinanceValidationRequest;
import com.example.sirh.dto.RhValidationRequest;
import com.example.sirh.dto.DirectionApprovalRequest;
import com.example.sirh.dto.CandidateStageRequest;
import com.example.sirh.dto.ConvertCandidateToEmployeeRequest;
import com.example.sirh.dto.EmployeeProfileResponse;
import com.example.sirh.dto.PageResponse;
import com.example.sirh.dto.EmployeePersonalChangeRequest;
import com.example.sirh.dto.UpdateEmployeeRequest;
import com.example.sirh.dto.CreateEmployeeContractRequest;
import com.example.sirh.dto.CreateCareerEventRequest;
import com.example.sirh.dto.RetentionPolicyRequest;
import com.example.sirh.service.RequisitionWorkflowService;
import com.example.sirh.service.EmployeeCoreService;
import com.example.sirh.service.EmployeeDocumentService;
import com.example.sirh.service.EmployeeAdministrationService;
import com.example.sirh.service.EmployeeChangeRequestService;
import jakarta.validation.Valid;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DirectoryController {
    private final DirectoryService directory;
    private final JdbcTemplate jdbc;
    private final RequisitionWorkflowService workflow;
    private final EmployeeCoreService employees;
    private final EmployeeDocumentService employeeDocuments;
    private final EmployeeAdministrationService employeeAdministration;
    private final EmployeeChangeRequestService employeeChangeRequests;

    public DirectoryController(DirectoryService directory, JdbcTemplate jdbc, RequisitionWorkflowService workflow,
            EmployeeCoreService employees, EmployeeDocumentService employeeDocuments,
            EmployeeAdministrationService employeeAdministration, EmployeeChangeRequestService employeeChangeRequests) {
        this.directory = directory;
        this.jdbc = jdbc;
        this.workflow = workflow;
        this.employees = employees;
        this.employeeDocuments = employeeDocuments;
        this.employeeAdministration=employeeAdministration;
        this.employeeChangeRequests=employeeChangeRequests;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "database", jdbc.queryForObject("SELECT current_database()", String.class));
    }

    @GetMapping("/users") public List<Map<String, Object>> users() { return directory.users(); }
    @GetMapping("/departments") public List<Map<String, Object>> departments(Authentication actor) {
        var rows = directory.departments();
        if (!has(actor, "ROLE_Manager")) return rows;
        var managed = managedDepartments(actor);
        return rows.stream().filter(d -> managed.contains(d.get("id"))).toList();
    }
    @GetMapping("/departments/{id}") public Map<String, Object> department(@PathVariable String id, Authentication actor) {
        var row = directory.department(id);
        if (has(actor, "ROLE_Manager") && !managedDepartments(actor).contains(id))
            throw new com.example.sirh.service.ForbiddenOperationException("Accès à ce département refusé.");
        return row;
    }
    @GetMapping("/departments/{id}/positions") public List<Map<String, Object>> departmentPositions(@PathVariable String id, Authentication actor) {
        department(id, actor);
        return directory.positionsForDepartment(id);
    }
    @GetMapping("/positions") public List<Map<String, Object>> positions(Authentication actor) {
        var rows = directory.positions();
        if (!has(actor, "ROLE_Manager")) return rows;
        var managed = managedDepartments(actor);
        return rows.stream().filter(p -> managed.contains(p.get("departmentId"))).toList();
    }
    @GetMapping("/requisitions")
    public List<Map<String, Object>> requisitions(@RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String status, @RequestParam(required = false) String search,
            @RequestParam(required = false) String priority, @RequestParam(required = false) String contract,
            @RequestParam(required = false) String budgetStatus, @RequestParam(required = false) String salaryBand,
            Authentication actor) {
        return directory.requisitions(departmentId, status, search, has(actor, "ROLE_Manager") ? actor.getName() : null,
                priority, contract, budgetStatus, salaryBand);
    }
    @PostMapping("/requisitions")
    public Map<String, Object> createRequisition(@Valid @RequestBody CreateRequisitionRequest request, Authentication actor) {
        String id = workflow.create(request, actor);
        return Map.of("id", id, "requisition", requisition(id, actor));
    }
    @PostMapping("/requisitions/{id}/resubmit")
    public Map<String, String> resubmit(@PathVariable String id, @Valid @RequestBody CreateRequisitionRequest request, Authentication actor) {
        workflow.resubmit(id, request, actor);
        boolean submitted = Boolean.TRUE.equals(request.submit());
        return Map.of("status", submitted ? "en_cours_rh" : "brouillon", "message", submitted ? "Demande resoumise a RH." : "Brouillon enregistre.");
    }
    @PostMapping("/requisitions/{id}/rh-validation")
    public Map<String, String> validateRh(@PathVariable String id, @Valid @RequestBody RhValidationRequest request, Authentication actor) {
        workflow.validateRh(id, request, actor);
        return Map.of("status", request.approved() ? "en_cours_finance" : "brouillon", "message", request.approved() ? "Validation RH enregistree." : "Demande renvoyee au manager pour correction.");
    }
    @PostMapping("/requisitions/{id}/finance-validation")
    public Map<String, String> validateFinance(@PathVariable String id, @Valid @RequestBody FinanceValidationRequest request, Authentication actor) {
        workflow.validateFinance(id, request, actor);
        return Map.of("status", request.approved() ? "en_cours_direction" : "brouillon",
                "message", request.approved() ? "Validation Finance enregistrée." : "Demande renvoyée au manager pour correction.");
    }
    @PostMapping("/requisitions/{id}/direction-approval")
    public Map<String, String> approveDirection(@PathVariable String id, @Valid @RequestBody DirectionApprovalRequest request, Authentication actor) {
        workflow.approveDirection(id, request, actor);
        return Map.of("status", request.approved() ? "publiee" : "brouillon",
                "message", request.approved() ? "Demande approuvée et poste existant rattaché." : "Demande renvoyée au manager pour correction.");
    }
    @GetMapping("/requisitions/{id}") public Map<String, Object> requisition(@PathVariable String id, Authentication actor) {
        return directory.requisitions(null, null, null, has(actor, "ROLE_Manager") ? actor.getName() : null).stream().filter(row -> id.equals(row.get("id"))).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable : " + id));
    }
    @GetMapping("/requisitions/{id}/history") public List<Map<String, Object>> history(@PathVariable String id, Authentication actor) {
        requisition(id, actor);
        return jdbc.queryForList("""
            SELECT id, step_name AS \"stepName\", author_name AS author, author_title AS \"authorTitle\",
                   display_date AS \"dateStr\", quote, color FROM requisition_audit_events
            WHERE requisition_id=? ORDER BY id
            """, id);
    }
    @GetMapping("/candidates") public List<Map<String, Object>> candidates(Authentication actor) {
        if (!has(actor, "CAN_MANAGE_CANDIDATES"))
            throw new com.example.sirh.service.ForbiddenOperationException("Gestion des candidats non autorisée.");
        return directory.candidates();
    }
    @GetMapping("/candidates/{id}") public Map<String, Object> candidate(@PathVariable String id, Authentication actor) {
        if (!has(actor, "CAN_MANAGE_CANDIDATES"))
            throw new com.example.sirh.service.ForbiddenOperationException("Gestion des candidats non autorisée.");
        return directory.candidate(id);
    }
    @org.springframework.web.bind.annotation.PatchMapping("/candidates/{id}/stage")
    public Map<String, String> candidateStage(@PathVariable String id, @Valid @RequestBody CandidateStageRequest request, Authentication actor) {
        if (!has(actor, "CAN_MANAGE_CANDIDATES"))
            throw new com.example.sirh.service.ForbiddenOperationException("Gestion des candidats non autorisée.");
        directory.changeCandidateStage(id, request.stage(), request.reason());
        return Map.of("id", id, "stage", request.stage(), "message", "Étape du candidat mise à jour.");
    }
    @GetMapping("/employees")
    public PageResponse<EmployeeProfileResponse> employees(@RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String search,@RequestParam(required=false) String status,
            @RequestParam(required=false) String contractType,@RequestParam(required=false) String grade,
            @RequestParam(required=false) String managerId,@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="25") int size, Authentication actor) {
        return employees.list(departmentId,search,status,contractType,grade,managerId,page,size,actor);
    }
    @GetMapping("/employees/managers")
    public List<EmployeeCoreService.ManagerOption> employeeManagers(@RequestParam String departmentId, Authentication actor) {
        return employees.managers(departmentId, actor);
    }
    @GetMapping("/employees/manager-directory")
    public List<EmployeeCoreService.ManagerOption> employeeManagerDirectory(Authentication actor){return employees.managerDirectory(actor);}
    @GetMapping("/employees/{id}")
    public EmployeeProfileResponse employee(@PathVariable int id, Authentication actor) { return employees.get(id, actor); }
    @GetMapping("/employees/{id}/national-id")
    public Map<String,String> employeeNationalId(@PathVariable int id,Authentication actor){
        return java.util.Collections.singletonMap("nationalId",employees.revealNationalId(id,actor));
    }
    @GetMapping("/employees/{id}/career")
    public List<EmployeeCoreService.CareerEvent> employeeCareer(@PathVariable int id, Authentication actor) {
        return employees.career(id, actor);
    }
    @GetMapping("/employees/{id}/contracts")
    public List<EmployeeCoreService.ContractRecord> employeeContracts(@PathVariable int id, Authentication actor) {
        return employees.contracts(id, actor);
    }
    @PatchMapping("/employees/{id}")
    public EmployeeProfileResponse updateEmployee(@PathVariable int id,@Valid @RequestBody UpdateEmployeeRequest request,Authentication actor){
        return employeeAdministration.update(id,request,actor);
    }
    @PostMapping("/employees/{id}/contracts")
    public EmployeeProfileResponse addEmployeeContract(@PathVariable int id,@Valid @RequestBody CreateEmployeeContractRequest request,Authentication actor){
        return employeeAdministration.addContract(id,request,actor);
    }
    @PostMapping("/employees/{id}/career")
    public EmployeeCoreService.CareerEvent addCareerEvent(@PathVariable int id,@Valid @RequestBody CreateCareerEventRequest request,Authentication actor){
        return employeeAdministration.addCareerEvent(id,request,actor);
    }
    @PostMapping("/employees/{id}/change-requests")
    public EmployeeChangeRequestService.ChangeRequestRecord submitEmployeeChange(@PathVariable int id,
            @Valid @RequestBody EmployeePersonalChangeRequest request,Authentication actor){
        return employeeChangeRequests.submit(id,request,actor);
    }
    @GetMapping("/employee-change-requests")
    public List<EmployeeChangeRequestService.ChangeRequestRecord> pendingEmployeeChanges(Authentication actor){
        return employeeChangeRequests.pending(actor);
    }
    @PatchMapping("/employee-change-requests/{requestId}")
    public EmployeeChangeRequestService.ChangeRequestRecord reviewEmployeeChange(@PathVariable long requestId,
            @RequestBody ChangeDecisionRequest request,Authentication actor){
        return employeeChangeRequests.review(requestId,request.approved(),request.note(),actor);
    }
    @GetMapping("/gdpr/retention-policies")
    public List<EmployeeAdministrationService.RetentionPolicy> retentionPolicies(Authentication actor){
        return employeeAdministration.retentionPolicies(actor);
    }
    @PutMapping("/gdpr/retention-policies")
    public EmployeeAdministrationService.RetentionPolicy setRetentionPolicy(@Valid @RequestBody RetentionPolicyRequest request,Authentication actor){
        return employeeAdministration.setRetentionPolicy(request,actor);
    }
    @PostMapping("/employees/{id}/anonymize")
    public EmployeeAdministrationService.AnonymizationResult anonymizeEmployee(@PathVariable int id,Authentication actor){
        return employeeAdministration.anonymizeLeaver(id,actor);
    }
    @GetMapping("/employees/{id}/documents")
    public List<EmployeeDocumentService.DocumentRecord> employeeDocuments(@PathVariable int id, Authentication actor) {
        return employeeDocuments.list(id, actor);
    }
    @PostMapping(value="/employees/{id}/documents", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeDocumentService.DocumentRecord uploadEmployeeDocument(@PathVariable int id,
            @RequestParam String documentType,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) java.time.LocalDate expirationDate,
            @RequestPart("file") MultipartFile file, Authentication actor) {
        return employeeDocuments.upload(id, documentType, expirationDate, file, actor);
    }
    @GetMapping("/employees/{id}/documents/{documentId}/content")
    public ResponseEntity<byte[]> employeeDocumentContent(@PathVariable int id, @PathVariable int documentId, Authentication actor) {
        var content = employeeDocuments.download(id, documentId, actor);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(content.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(content.filename(), java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .body(content.content());
    }
    @PatchMapping("/employees/{id}/documents/{documentId}/verification")
    public EmployeeDocumentService.DocumentRecord verifyEmployeeDocument(@PathVariable int id, @PathVariable int documentId,
            @RequestBody DocumentVerificationRequest request, Authentication actor) {
        return employeeDocuments.verify(id, documentId, request.status(), request.note(), actor);
    }
    @GetMapping("/employee-document-notifications")
    public List<EmployeeDocumentService.ExpiryNotification> documentNotifications(Authentication actor) {
        return employeeDocuments.notifications(actor);
    }
    @PostMapping("/employee-documents/check-expirations")
    public Map<String, String> checkDocumentExpirations(Authentication actor) {
        if (!has(actor, "ROLE_RH")) throw new com.example.sirh.service.ForbiddenOperationException("Action réservée aux RH.");
        employeeDocuments.checkDocumentExpirations();
        return Map.of("status", "ok", "message", "Vérification des échéances terminée.");
    }
    @PostMapping("/candidates/{id}/employee")
    public EmployeeProfileResponse convertCandidate(@PathVariable String id,
            @Valid @RequestBody ConvertCandidateToEmployeeRequest request, Authentication actor) {
        if (!has(actor, "CAN_MANAGE_CANDIDATES"))
            throw new com.example.sirh.service.ForbiddenOperationException("Conversion candidat-salarié réservée aux RH autorisées.");
        return employees.createFromCandidate(id, request, actor);
    }
    @GetMapping("/onboarding") public List<Map<String, Object>> onboarding(Authentication actor) {
        if (!has(actor, "ROLE_RH"))
            throw new com.example.sirh.service.ForbiddenOperationException("Accès onboarding réservé aux RH.");
        return directory.onboarding();
    }
    @GetMapping({"/dashboard", "/dashboard/summary"}) public Map<String, Object> dashboard() {
        var result = jdbc.queryForMap("""
            SELECT count(*) AS total,
              count(*) FILTER (WHERE status IN ('en_cours_rh','en_cours_finance','en_cours_direction')) AS \"inProgress\",
              count(*) FILTER (WHERE priority='urgente') AS urgent,
              count(*) FILTER (WHERE status='publiee') AS published
            FROM requisitions
            """);
        result.put("toQualify", jdbc.queryForObject("SELECT count(*) FROM requisitions WHERE status='en_cours_rh'", Long.class));
        result.put("activeCandidates", jdbc.queryForObject("SELECT count(*) FROM candidates WHERE kanban_stage NOT IN ('retenu','refuse')", Long.class));
        result.put("onboardingInProgress", jdbc.queryForObject("SELECT count(*) FROM onboarding_people", Long.class));
        return result;
    }

    private boolean has(Authentication actor, String authority) {
        return actor != null && actor.getAuthorities().stream().anyMatch(a -> authority.equals(a.getAuthority()));
    }

    public record DocumentVerificationRequest(String status, String note) { }
    public record ChangeDecisionRequest(boolean approved,String note){ }

    private List<?> managedDepartments(Authentication actor) {
        return (List<?>) directory.users().stream().filter(u -> actor.getName().equals(u.get("id")))
                .findFirst().orElseThrow().get("managedDepartmentIds");
    }
}
