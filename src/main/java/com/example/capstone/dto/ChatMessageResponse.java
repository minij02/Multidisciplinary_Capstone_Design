package com.example.capstone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private String sender;   // "user" or "bot"
    private String message;
    private LocalDateTime createdAt;
}