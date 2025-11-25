package com.example.capstone.repository;

import com.example.capstone.domain.TripChapter;
import com.example.capstone.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripChapterRepository extends JpaRepository<TripChapter, Long> {

    // JpaRepository<TripChapter, Long>를 상속받는 것만으로
    // save(), findById(), findAll(), deleteById() 등의
    // 기본적인 DB 작업 메서드가 자동으로 생성됩니다.

    // (선택적 기능) 나중에 "마이페이지"에서 특정 사용자가 작성한
    // 모든 여행 챕터를 조회할 때 사용할 수 있습니다.
    // List<TripChapter> findByUser(User user);
}