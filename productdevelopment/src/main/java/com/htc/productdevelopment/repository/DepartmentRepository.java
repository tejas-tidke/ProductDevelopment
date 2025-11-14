	package com.htc.productdevelopment.repository;
	
	import com.htc.productdevelopment.model.Department;
	import org.springframework.data.jpa.repository.JpaRepository;
	
	public interface DepartmentRepository extends JpaRepository<Department, Integer> {
	
	}
