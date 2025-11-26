import React, { useState } from 'react';
import './ImageGallery.css'; // 스타일 시트
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// (예시) 이미지 갤러리에 표시할 샘플 이미지 데이터입니다.
// 실제로는 Spring Boot API로 받아오거나, 사용자가 업로드한 이미지를 사용해야 합니다.
const sampleImages = [
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
  'https://images.unsplash.com/photo-1511576661531-b34d7da5d0bb?w=300',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=300',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=300',
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=300',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300',
];

const ImageGallery: React.FC = () => {
  const { diaryEntryId } = useParams<{ diaryEntryId: string }>();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // [8. 완료] 팝업
  const navigate = useNavigate();
  const MAX_SELECT = 8; // 최대 8장

  // 이미지 클릭 시 선택/해제 토글
  const handleImageClick = (imageUrl: string) => {
    setSelectedImages((prevSelected) => {
      if (prevSelected.includes(imageUrl)) {
        // 이미 선택된 이미지면 선택 해제
        return prevSelected.filter((url) => url !== imageUrl);
      } else {
        // 새로 선택 (최대 8장까지만)
        if (prevSelected.length < MAX_SELECT) {
          return [...prevSelected, imageUrl];
        }
        return prevSelected; // 8장 초과 시 추가 안 함
      }
    });
  };

  // 상단 'Upload' 버튼 클릭
  const handleUploadClick = () => {
    if (selectedImages.length > 0) {
      setShowConfirmModal(true); // [8. 팝업] 띄우기
    } else {
      alert("이미지를 하나 이상 선택하세요.");
    }
  };

  // [8. 팝업] "네" (완료) 버튼 클릭
 const handleFinalConfirm = async () => {
     console.log(`일기 ID [${diaryEntryId}]에 다음 이미지들을 저장합니다:`, selectedImages);

     // (API 호출 #4 - 예시)
     // 실제로는 S3 등에 이미지 파일을 먼저 업로드(Presigned-URL 등)하고,
     // 그 URL 목록을 Spring Boot API로 전송해야 합니다.
     try {
       // await axios.post(`/api/diary/entry/${diaryEntryId}/images`, {
       //   imageUrls: selectedImages
       // });

       // (지금은 API가 없으므로 성공했다고 가정하고 홈으로 이동)
       setShowConfirmModal(false);
       navigate('/'); // 모든 플로우 완료! 홈으로 이동

     } catch (error) {
       console.error("이미지 저장 실패:", error);
       alert("이미지 저장에 실패했습니다.");
     }
   };

  return (
    <div className="gallery-page">

      {/* 1. 상단 헤더 */}
      <header className="gallery-header">
        <button onClick={() => navigate(-1)} className="header-btn">Cancel</button>
        <span className="header-title">Select up to 8 items</span>
        <button onClick={handleUploadClick} className="header-btn primary">Upload</button>
      </header>

      {/* 2. 메인 이미지 그리드 */}
      <main className="image-grid-container">
        {sampleImages.map((src, index) => {
          const isSelected = selectedImages.includes(src);
          return (
            <div
              key={index}
              className={`grid-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleImageClick(src)}
            >
              <img src={src} alt={`gallery-item-${index}`} />
              {/* 선택 시 파란색 원 표시 */}
              <div className="selection-overlay">
                <div className="selection-circle"></div>
              </div>
            </div>
          );
        })}
      </main>

      {/* 3. 하단 선택된 이미지 개수 (플로우 이미지에는 없지만 유용함) */}
      <footer className="gallery-footer">
        Show Selected ({selectedImages.length})
      </footer>

      {/* 4. [8. 일기장 생성 완료] 팝업창 (hidden 상태) */}
      {showConfirmModal && (
        <div className="modal-backdrop-gallery">
          <div className="modal-content-gallery">
            <div className="modal-icon-wrapper">
              {/* 다이어리 아이콘 (임시) */}
              <span>📝</span>
            </div>
            <h3>일기장 생성을 완료할까요?</h3>
            <p>일기장 생성 후에는 메인 페이지로 이동합니다.</p>
            <div className="modal-buttons-gallery">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn-cancel"
              >
                아니오
              </button>
              <button
                onClick={handleFinalConfirm}
                className="btn-primary"
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;