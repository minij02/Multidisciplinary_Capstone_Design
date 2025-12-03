package com.example.capstone.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DiaryUpdateRequest {
    private String subtitle;
    private String content; // 수정할 본문 내용
    
    // 실제 파일 업로드는 MultipartFile로 처리해야 하지만, 
    // 현재 구조상 JSON으로 처리하기 위해 임시로 이미지 URL 문자열로 받습니다.
    // (실제 프로젝트에서는 S3 업로드 후 URL을 받거나 Multipart 요청을 사용해야 합니다)
    private String imageUrl; 
}