package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByTokenAndEmail(String token, String email);
    
    Optional<Invitation> findByToken(String token);
    
    List<Invitation> findByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    void deleteByToken(String token);
}