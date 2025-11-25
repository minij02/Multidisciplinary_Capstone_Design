package com.example.capstone.security;

import com.example.capstone.domain.User;
import com.example.capstone.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Key;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    /**
     * application.properties에서 JWT 시크릿 키를 주입받습니다.
     * 주의: 이 필터가 토큰 생성 및 검증을 모두 처리하도록 수정합니다.
     */
    @Value("${jwt.secret}")
    private String secret;

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();
    System.out.println("[JWT 필터 검사] 요청 경로 = " + path);
    
    return path.equals("/api/auth") ||     
           path.startsWith("/api/auth/") || 
           path.startsWith("/login") || 
           path.startsWith("/oauth2");
}

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1. HTTP 헤더에서 JWT 토큰 추출
            String jwt = getJwtFromRequest(request);

            if (jwt != null && validateToken(jwt)) {
                // 2. 토큰에서 사용자 ID(Subject) 추출
                String userIdStr = getUserIdFromJwt(jwt);
                Long userId = Long.valueOf(userIdStr);

                // 3. DB에서 사용자 정보 로드
                Optional<User> userOptional = userRepository.findById(userId);

                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    // 4. PrincipalDetails 생성 및 인증 객체 구성
                    PrincipalDetails principalDetails = new PrincipalDetails(user);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principalDetails, null, principalDetails.getAuthorities());
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // 5. Spring Security Context에 인증 정보 설정
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        // 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    // --- 헬퍼 메서드 ---
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 제거
        }
        return null;
    }

    private boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            // 토큰 검증 실패 (만료, 잘못된 서명 등)
            return false;
        }
    }
    
    private String getUserIdFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }
}