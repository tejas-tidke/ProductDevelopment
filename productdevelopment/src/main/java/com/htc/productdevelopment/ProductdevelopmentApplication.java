package com.htc.productdevelopment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableCaching
@ComponentScan(basePackages = "com.htc.productdevelopment")
@EntityScan(basePackages = "com.htc.productdevelopment.model")
@EnableJpaRepositories(basePackages = "com.htc.productdevelopment.repository")
public class ProductdevelopmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductdevelopmentApplication.class, args);
    }

}
