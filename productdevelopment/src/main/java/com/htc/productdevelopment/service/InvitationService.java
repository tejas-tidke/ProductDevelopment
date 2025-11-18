package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Invitation;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.InvitationRepository;
import com.htc.productdevelopment.service.UserService;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserService userService;
    private final JavaMailSender mailSender;

    private final String frontendUrl;

    public InvitationService(
            InvitationRepository invitationRepository,
            UserService userService,
            JavaMailSender mailSender,
            @Value("${app.frontend.url}") String frontendUrl
    ) {
        this.invitationRepository = invitationRepository;
        this.userService = userService;
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
    }

    // -------------------------------------------------------------
    // 1️⃣ Create Invitation
    // -------------------------------------------------------------
    public Invitation createInvitation(String email, String role, Long deptId, String organization, String invitedBy) {

        Invitation inv = new Invitation();
        inv.setEmail(email.toLowerCase().trim());
        inv.setRole(role);
        inv.setDepartmentId(deptId);
        inv.setOrganization(organization);
        inv.setInvitedBy(invitedBy); // Set the invited by field
        inv.setToken(UUID.randomUUID().toString());
        inv.setCreatedAt(LocalDateTime.now());
        inv.setExpiresAt(LocalDateTime.now().plusHours(48)); // 48 hours expiration
        inv.setUsed(false);
        inv.setSent(false);

        Invitation savedInvitation = invitationRepository.save(inv);
        
        // Send invitation email
        sendInvitationEmail(savedInvitation);
        
        return savedInvitation;
    }

    // -------------------------------------------------------------
    // 2️⃣ Send Invitation Email
    // -------------------------------------------------------------
    private void sendInvitationEmail(Invitation inv) {
        try {
            String invitationLink = generateInvitationLink(inv);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(inv.getEmail());
            message.setSubject("You've been invited to join our platform");
            message.setText(
                "Hello,\n\n" +
                "You have been invited to join our platform. Please click the link below to complete your registration:\n\n" +
                invitationLink + "\n\n" +
                "This link will expire in 48 hours.\n\n" +
                "Best regards,\n" +
                "The Team"
            );
            
            mailSender.send(message);
            
            // Mark as sent in database
            inv.setSent(true);
            invitationRepository.save(inv);
        } catch (Exception e) {
            // Log error but don't fail the invitation creation
            e.printStackTrace();
        }
    }

    // -------------------------------------------------------------
    // 3️⃣ Generate secure invitation link
    // -------------------------------------------------------------
    public String generateInvitationLink(Invitation inv) {
        return frontendUrl + "/complete-invitation?token=" + inv.getToken() + "&email=" + inv.getEmail();
    }

    // -------------------------------------------------------------
    // 4️⃣ Verify token BEFORE showing Google/Microsoft login
    // -------------------------------------------------------------
    public Invitation verifyInvitation(String token, String email) throws Exception {

        Optional<Invitation> opt = invitationRepository.findByTokenAndEmail(token, email.toLowerCase().trim());

        if (opt.isEmpty()) {
            throw new Exception("Invalid or mismatched invitation link.");
        }

        Invitation inv = opt.get();

        if (inv.isUsed()) {
            throw new Exception("This link has already been used.");
        }

        if (LocalDateTime.now().isAfter(inv.getExpiresAt())) {
            throw new Exception("This invitation link has expired.");
        }

        return inv;
    }

    // -------------------------------------------------------------
    // 5️⃣ Complete Invitation (after Google/Microsoft login & setting password)
    // -------------------------------------------------------------
    public User completeInvitation(String token, String email, String fullName, String password) throws Exception {

        Invitation inv = verifyInvitation(token, email);

        // 1. Create Firebase user (or get existing)
        User firebaseUser;
        try {
            firebaseUser = userService.createUserInFirebase(email, password, fullName);
        } catch (Exception e) {
            // If user already exists in Firebase, we'll use the existing one
            // Get the existing user from Firebase
            com.google.firebase.auth.UserRecord existingUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUserByEmail(email);
            firebaseUser = new User();
            firebaseUser.setUid(existingUser.getUid());
            firebaseUser.setEmail(email);
            firebaseUser.setName(fullName);
        }

        // 2. Save in DB
        User created = userService.saveUserToDB(
                firebaseUser.getUid(),
                email,
                fullName,
                parseRole(inv.getRole())
        );

        // 3. Add department if present
        if (inv.getDepartmentId() != null) {
            created.setDepartment(userService.getDepartmentFromId(inv.getDepartmentId()));
        }

        // 4. Add organization if present
        if (inv.getOrganization() != null && !inv.getOrganization().isEmpty()) {
            created.setOrganization(inv.getOrganization());
        }

        // Save updates
        userService.updateUserById(created.getId(), created);

        // 5. Mark invitation used
        inv.setUsed(true);
        invitationRepository.save(inv);

        return created;
    }

    private User.Role parseRole(String role) {
        try { 
            return User.Role.valueOf(role.toUpperCase()); 
        }
        catch (Exception e) { 
            return User.Role.REQUESTER; 
        }
    }
    
    // -------------------------------------------------------------
    // Get invitation by token
    // -------------------------------------------------------------
    public Optional<Invitation> getInvitationByToken(String token) {
        return invitationRepository.findByToken(token);
    }
}