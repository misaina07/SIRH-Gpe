package com.example.sirh;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class DatabaseTest {

    @Bean
    CommandLineRunner testConnection(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {

                System.out.println("================================");
                System.out.println("CONNEXION POSTGRESQL REUSSIE !");
                System.out.println("Base : " +
                    connection.getCatalog());
                System.out.println("================================");

            } catch (Exception e) {
                System.out.println("ECHEC DE CONNEXION POSTGRESQL !");
                e.printStackTrace();
            }
        };
    }
}