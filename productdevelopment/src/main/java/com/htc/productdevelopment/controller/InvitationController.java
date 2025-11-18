package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Invitation;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.service.InvitationService;
import com.htc.productdevelopment.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "http://localhost:5173")
public class InvitationController {

    private final InvitationService invitationService;
    private final UserService userService;

    @Autowired
    public InvitationController(InvitationService invitationService, UserService userService) {
        this.invitationService = invitationService;
        this.userService = userService;
    }

    // -------------------------------------------------------------------------
    // 1️⃣ Create invitation (Admin / Super Admin)
    // -------------------------------------------------------------------------
    @PostMapping("/create")
    public ResponseEntity<?> createInvitation(@RequestBody Map<String, Object> body) {

        try {
            String email = (String) body.get("email");
            String role = (String) body.get("role");
            Long departmentId = body.get("departmentId") != null
                    ? Long.parseLong(body.get("departmentId").toString()) : null;

            // Only Super Admin provides organization
            String organization = (String) body.get("organization");
            
            // For now, we'll use a placeholder for invitedBy
            // In a real implementation, you would get this from the authenticated user
            String invitedBy = "system"; // Placeholder - should be replaced with actual user ID

            Invitation inv = invitationService.createInvitation(
                    email,
                    role,
                    departmentId,
                    organization,
                    invitedBy
            );

            String invitationLink = invitationService.generateInvitationLink(inv);

            return ResponseEntity.ok(Map.of(
                    "message", "Invitation created successfully",
                    "invitationLink", invitationLink
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    // -------------------------------------------------------------------------
    // 2️⃣ Validate invitation link before showing Google/Microsoft login
    // -------------------------------------------------------------------------
    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(
            @RequestParam String token,
            @RequestParam String email
    ) {
        try {
            Invitation inv = invitationService.verifyInvitation(token, email);

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "email", inv.getEmail(),
                    "role", inv.getRole(),
                    "departmentId", inv.getDepartmentId(),
                    "organization", inv.getOrganization()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", e.getMessage()
            ));
        }
    }

    // -------------------------------------------------------------------------
    // 3️⃣ Complete invitation (after Google/Microsoft login & setting password)
    // -------------------------------------------------------------------------
    @PostMapping("/complete")
    public ResponseEntity<?> completeInvitation(@RequestBody Map<String, Object> body) {

        try {
            String token = (String) body.get("token");
            String email = (String) body.get("email");
            String fullName = (String) body.get("fullName");
            String password = (String) body.get("password");

            User created = invitationService.completeInvitation(
                    token,
                    email,
                    fullName,
                    password
            );

            return ResponseEntity.ok(Map.of(
                    "message", "User account created successfully",
                    "uid", created.getUid(),
                    "email", created.getEmail()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }
}