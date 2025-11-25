package com.example.capstone.domain;

import jakarta.persistence.Column; // ★ Javax 대신 'Jakarta' Persistence를 사용해야 합니다 (Spring Boot 3.x)
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass // 이 클래스를 상속받는 Entity들은 아래 필드들을 컬럼으로 갖게 됨
@EntityListeners(AuditingEntityListener.class) // JPA Auditing(감시) 기능 활성화
public abstract class BaseTimeEntity {

    @CreatedDate // Entity가 생성될 때 시간이 자동 저장됩니다.
    @Column(name = "생성일", updatable = false) // DDL의 '생성일' 컬럼과 매핑
    private LocalDateTime createdAt;

    @LastModifiedDate // Entity가 수정될 때 시간이 자동 저장됩니다.
    @Column(name = "수정일") // DDL의 '수정일' 컬럼과 매핑
    private LocalDateTime updatedAt;
}