package com.example.capstone.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EntryListItemResponse {
    private Long entryId;
    private String subtitle; 
    private LocalDateTime createdTime;
}