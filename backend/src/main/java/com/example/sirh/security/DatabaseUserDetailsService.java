package com.example.sirh.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final JdbcTemplate jdbc;
    public DatabaseUserDetailsService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
        var rows = jdbc.queryForList("""
            SELECT id, role_type, can_validate_rh, can_validate_finance, can_validate_direction,
                   can_create_requisition, can_manage_candidates FROM users WHERE id=?
            """, id);
        if (rows.isEmpty()) throw new UsernameNotFoundException("Utilisateur inconnu");
        var row = rows.getFirst();
        var authorities = new ArrayList<String>();
        authorities.add("ROLE_" + row.get("role_type"));
        if (Boolean.TRUE.equals(row.get("can_validate_rh"))) authorities.add("CAN_VALIDATE_RH");
        if (Boolean.TRUE.equals(row.get("can_validate_finance"))) authorities.add("CAN_VALIDATE_FINANCE");
        if (Boolean.TRUE.equals(row.get("can_validate_direction"))) authorities.add("CAN_VALIDATE_DIRECTION");
        if (Boolean.TRUE.equals(row.get("can_create_requisition"))) authorities.add("CAN_CREATE_REQUISITION");
        if (Boolean.TRUE.equals(row.get("can_manage_candidates"))) authorities.add("CAN_MANAGE_CANDIDATES");
        return User.withUsername(id).password("").authorities(authorities.toArray(String[]::new)).build();
    }
}
