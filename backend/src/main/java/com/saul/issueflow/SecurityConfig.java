package com.saul.issueflow;

import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
public class SecurityConfig {
    @Bean UserDetailsService users(@Value("${ISSUEFLOW_ADMIN_PASSWORD:}") String admin,
                                  @Value("${ISSUEFLOW_USER_PASSWORD:}") String user) {
        if (admin.length() < 12 || user.length() < 12 || admin.equals(user))
            throw new IllegalStateException("Configura ISSUEFLOW_ADMIN_PASSWORD e ISSUEFLOW_USER_PASSWORD diferentes y de al menos 12 caracteres.");
        var encoder = new BCryptPasswordEncoder(12);
        return new InMemoryUserDetailsManager(
            User.withUsername("admin").password(encoder.encode(admin)).roles("ADMIN").build(),
            User.withUsername("usuario").password(encoder.encode(user)).roles("USER").build());
    }
    @Bean org.springframework.security.crypto.password.PasswordEncoder encoder() { return new BCryptPasswordEncoder(12); }
    @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a
            .requestMatchers("/api/auth/csrf", "/api/auth/login", "/actuator/health").permitAll()
            .requestMatchers(HttpMethod.DELETE, "/api/issues/**").hasRole("ADMIN")
            .requestMatchers("/api/**").hasAnyRole("USER", "ADMIN")
            .anyRequest().denyAll())
            .requestCache(AbstractHttpConfigurer::disable)
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req,res,ex) -> error(res,401,"Inicia sesión para continuar."))
                .accessDeniedHandler((req,res,ex) -> error(res,403,"Permiso denegado o sesión de seguridad vencida. Vuelve a iniciar sesión.")))
            .formLogin(f -> f.loginProcessingUrl("/api/auth/login")
                .successHandler((req,res,auth) -> res.setStatus(204))
                .failureHandler((req,res,ex) -> error(res,401,"Usuario o contraseña incorrectos.")))
            .logout(l -> l.logoutUrl("/api/auth/logout").deleteCookies("ISSUEFLOW_SESSION")
                .logoutSuccessHandler((req,res,auth) -> res.setStatus(204)));
        return http.build();
    }
    private static void error(jakarta.servlet.http.HttpServletResponse res, int status, String detail) throws java.io.IOException {
        res.setStatus(status); res.setContentType("application/problem+json"); res.setCharacterEncoding("UTF-8");
        res.getWriter().write("{\"status\":" + status + ",\"detail\":\"" + detail + "\"}");
    }
}
