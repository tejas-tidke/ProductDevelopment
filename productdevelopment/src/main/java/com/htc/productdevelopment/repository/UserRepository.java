package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUid(String uid);
    Optional<User> findByEmail(String email);
    boolean existsByUid(String uid);
    boolean existsByEmail(String email);
    
    // Optimized queries that can take advantage of our new indexes
    List<User> findByRole(User.Role role);
    List<User> findByActive(boolean active);
    List<User> findByRoleAndActive(User.Role role, boolean active);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.active = :active")
    long countByActive(@Param("active") boolean active);
}