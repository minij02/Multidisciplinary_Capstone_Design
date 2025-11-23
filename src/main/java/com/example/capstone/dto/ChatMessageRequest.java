package com.example.capstone.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequest {

    private String sender; // "user" (프론트가 보낼 땐 항상 'user'겠죠)
    private String message; // 사용자가 입력한 텍스트 또는 음성인식 텍스트

}