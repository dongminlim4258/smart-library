let globalLibraryBooks = [];
let kakaoMap = null; 
let currentInfoWindow = null; 

window.onload = function() {
    initDatabase();
    setupSearch();
    setupNavigation(); 
    renderHotBooks(); 
    renderUserStatus(); // 대출 이용현황 데이터 매핑
    switchBoardTab('notice'); // 게시판 초기화면은 공지사항 설정
};

// 1. 도서 데이터 통합 로더
function initDatabase() {
    const dataSources = [
        { name: '불광역', raw: typeof bulgwangCSV !== 'undefined' ? bulgwangCSV : "" },
        { name: '시청역', raw: typeof cityhallCSV !== 'undefined' ? cityhallCSV : "" },
        { name: '역촌역', raw: typeof yeokchonCSV !== 'undefined' ? yeokchonCSV : "" },
        { name: '연신내역', raw: typeof yeonsinnaeCSV !== 'undefined' ? yeonsinnaeCSV : "" },
        { name: '합정역', raw: typeof hapjeongCSV !== 'undefined' ? hapjeongCSV : "" }
    ];

    globalLibraryBooks = [];
    dataSources.forEach(source => {
        if (!source.raw || !source.raw.trim()) return;
        const lines = source.raw.split(/\r?\n/);
        if (lines.length < 2) return;
        const headers = lines[0].split('\t');
        const tIdx = headers.findIndex(h => h.trim().includes('도서명'));
        const aIdx = headers.findIndex(h => h.trim().includes('저자'));
        const pIdx = headers.findIndex(h => h.trim().includes('출판사'));
        const iIdx = headers.findIndex(h => h.trim().includes('ISBN'));

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const row = lines[i].split('\t');
            const cleanText = (val) => val ? val.replace(/"/g, '').trim() : "";
            const title = tIdx !== -1 && row[tIdx] ? cleanText(row[tIdx]) : "";
            const author = aIdx !== -1 && row[aIdx] ? cleanText(row[aIdx]) : "저자 미상";
            const publisher = pIdx !== -1 && row[pIdx] ? cleanText(row[pIdx]) : "출판사 미상";
            const isbn = iIdx !== -1 && row[iIdx] ? cleanText(row[iIdx]) : "확인불가";
            if (title && title !== "도서명") {
                globalLibraryBooks.push({ title, author, publisher, isbn, location: source.name });
            }
        }
    });

    const hero = document.querySelector('.main-hero');
    if (hero) {
        const oldStatus = document.getElementById('db-status-tag');
        if (oldStatus) oldStatus.remove();
        const statusDiv = document.createElement('div');
        statusDiv.id = 'db-status-tag';
        statusDiv.style.cssText = "margin-top:10px; font-size:0.9rem; color:#2ed573; font-weight:bold;";
        if (globalLibraryBooks.length > 0) {
            statusDiv.innerHTML = ``;
        } else {
            statusDiv.innerHTML = `🔴 데이터 동기화 실패. 파일을 점검하세요.`;
            statusDiv.style.color = "#ff4757";
        }
        hero.appendChild(statusDiv);
    }
}

// 2. 윈도우 페이지 내비게이션 및 게시판 탭 컨트롤러
function setupNavigation() {
    const goToMapBtn = document.getElementById('go-to-map-btn');
    const goToUsageBtn = document.getElementById('go-to-usage-btn');
    const goToHotBtn = document.getElementById('go-to-hot-btn');
    const goToBoardBtn = document.getElementById('go-to-board-btn');
    const goToUserBtn = document.getElementById('go-to-user-btn');
    const backButtons = document.querySelectorAll('.back-btn');

    const tabNoticeBtn = document.getElementById('tab-notice-btn');
    const tabQnaBtn = document.getElementById('tab-qna-btn');

    function hideAllPages() {
        document.getElementById('main-dashboard-page').style.display = 'none';
        document.getElementById('search-results-page').style.display = 'none';
        document.getElementById('map-page').style.display = 'none';
        document.getElementById('usage-page').style.display = 'none';
        document.getElementById('hot-books-page').style.display = 'none';
        document.getElementById('board-page').style.display = 'none';
        document.getElementById('user-status-page').style.display = 'none';
    }

    if(goToMapBtn) goToMapBtn.onclick = () => { hideAllPages(); document.getElementById('map-page').style.display = 'block'; initKakaoMap(); };
    if(goToUsageBtn) goToUsageBtn.onclick = () => { hideAllPages(); document.getElementById('usage-page').style.display = 'block'; };
    if(goToHotBtn) goToHotBtn.onclick = () => { hideAllPages(); document.getElementById('hot-books-page').style.display = 'block'; };
    if(goToBoardBtn) goToBoardBtn.onclick = () => { hideAllPages(); document.getElementById('board-page').style.display = 'block'; switchBoardTab('notice'); };
    if(goToUserBtn) goToUserBtn.onclick = () => { hideAllPages(); document.getElementById('user-status-page').style.display = 'block'; };

    backButtons.forEach(btn => {
        btn.onclick = () => { hideAllPages(); document.getElementById('main-dashboard-page').style.display = 'block'; };
    });

    // 게시판 탭 기능 바인딩 (사진 속 인터페이스 매칭)
    if(tabNoticeBtn) {
        tabNoticeBtn.onclick = () => {
            tabNoticeBtn.classList.add('active');
            tabQnaBtn.classList.remove('active');
            switchBoardTab('notice');
        };
    }
    if(tabQnaBtn) {
        tabQnaBtn.onclick = () => {
            tabQnaBtn.classList.add('active');
            tabNoticeBtn.classList.remove('active');
            switchBoardTab('qna');
        };
    }
}

// 3. 🗺️ 84개 스마트도서관 맵 빌더
function initKakaoMap() {
    const container = document.getElementById('library-map-container');
    const options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 7 };
    if (!kakaoMap) { kakaoMap = new kakao.maps.Map(container, options); }

 const locations = [
  { line: "3호선", name: "수서", count: 1, operator: "강남구청", lat: 37.487507, lng: 127.101324 },
  { line: "7호선", name: "청담", count: 1, operator: "강남구청", lat: 37.519097, lng: 127.051851 },
  { line: "3호선", name: "압구정", count: 1, operator: "강남구청", lat: 37.526169, lng: 127.028502 },
  { line: "8호선", name: "천호", count: 1, operator: "강동문화재단", lat: 37.53792, lng: 127.123179 },
  { line: "5호선", name: "상일동", count: 1, operator: "강동문화재단", lat: 37.556714, lng: 127.166381 },
  { line: "5호선", name: "고덕", count: 1, operator: "강동문화재단", lat: 37.555002, lng: 127.154214 },
  { line: "4호선", name: "수유", count: 1, operator: "강북구청", lat: 37.637127, lng: 127.024731 },
  { line: "4호선", name: "미아", count: 1, operator: "강북구청", lat: 37.626435, lng: 127.026151 },
  { line: "4호선", name: "미아사거리", count: 1, operator: "강북구청", lat: 37.613276, lng: 127.030083 },
  { line: "5호선", name: "마곡", count: 1, operator: "강서구청", lat: 37.562182, lng: 126.82693 },
  { line: "5호선", name: "우장산", count: 1, operator: "강서구청", lat: 37.548864, lng: 126.83633 },
  { line: "5호선", name: "까치산", count: 1, operator: "강서구청", lat: 37.53181, lng: 126.846706 },
  { line: "2호선", name: "서울대입구", count: 1, operator: "관악구청", lat: 37.481233, lng: 126.952745 },
  { line: "2호선", name: "신대방", count: 1, operator: "관악구청", lat: 37.487534, lng: 126.913279 },
  { line: "2호선", name: "봉천", count: 1, operator: "관악구청", lat: 37.482416, lng: 126.941896 },
  { line: "2호선", name: "낙성대", count: 1, operator: "관악구청", lat: 37.47693, lng: 126.963783 },
  { line: "2호선", name: "신림", count: 1, operator: "관악구청", lat: 37.484216, lng: 126.929573 },
  { line: "5호선", name: "군자", count: 1, operator: "광진구청", lat: 37.557102, lng: 127.079559 },
  { line: "2호선", name: "구의", count: 1, operator: "광진구청", lat: 37.536857, lng: 127.085024 },
  { line: "7호선", name: "천왕", count: 1, operator: "구로구청", lat: 37.486699, lng: 126.838684 },
  { line: "7호선", name: "온수(성공회대입구)", count: 1, operator: "구로구청", lat: 37.492059, lng: 126.823294 },
  { line: "2호선", name: "대림", count: 1, operator: "구로도서관", lat: 37.492426, lng: 126.895293 },
  { line: "6호선", name: "디지털미디어시티", count: 1, operator: "구립증산정보도서관", lat: 37.577005, lng: 126.898643 },
  { line: "7호선", name: "가산디지털단지역", count: 1, operator: "금천구청", lat: 37.480376, lng: 126.882704 },
  { line: "7호선", name: "노원", count: 1, operator: "노원구청", lat: 37.654478, lng: 127.060555 },
  { line: "7호선", name: "하계", count: 1, operator: "노원구청", lat: 37.636363, lng: 127.067999 },
  { line: "3호선", name: "쌍문", count: 1, operator: "도봉구청", lat: 37.648274, lng: 127.034381 },
  { line: "2호선", name: "용두", count: 1, operator: "동대문구청", lat: 37.574012, lng: 127.03811 },
  { line: "5호선", name: "답십리", count: 1, operator: "동대문구청", lat: 37.566833, lng: 127.05266 },
  { line: "4호선", name: "총신대입구", count: 1, operator: "동작구청", lat: 37.487521, lng: 126.982309 },
  { line: "7호선", name: "장승배기역", count: 1, operator: "동작구청", lat: 37.504845, lng: 126.939025 },
  { line: "7호선", name: "신대방삼거리역", count: 1, operator: "동작구청", lat: 37.499717, lng: 126.928218 },
  { line: "6호선", name: "합정", count: 1, operator: "마포중앙도서관", lat: 37.549033, lng: 126.913546 },
  { line: "2호선", name: "아현", count: 1, operator: "서대문구청", lat: 37.557407, lng: 126.956079 },
  { line: "3호선", name: "독립문", count: 1, operator: "서대문구청", lat: 37.574534, lng: 126.957902 },
  { line: "3호선", name: "홍제", count: 1, operator: "서대문도서관", lat: 37.588851, lng: 126.944092 },
  { line: "5호선", name: "서대문", count: 1, operator: "서대문도서관", lat: 37.565812, lng: 126.966639 },
  { line: "2호선", name: "시청", count: 1, operator: "서울특별시 서울도서관", lat: 37.56359, lng: 126.975407 },
  { line: "5호선", name: "길동", count: 1, operator: "서울특별시교육청강동도서관", lat: 37.538022, lng: 127.140085 },
  { line: "5호선", name: "공덕", count: 1, operator: "서울특별시교육청마포평생학습관", lat: 37.544005, lng: 126.951058 },
  { line: "5호선", name: "개롱", count: 1, operator: "서울특별시교육청송파도서관", lat: 37.498097, lng: 127.134817 },
  { line: "3호선", name: "경복궁", count: 1, operator: "서울특별시교육청종로도서관", lat: 37.575844, lng: 126.973576 },
  { line: "3호선", name: "양재", count: 1, operator: "서초구청", lat: 37.48466, lng: 127.03513 },
  { line: "7호선", name: "내방", count: 1, operator: "서초구청", lat: 37.48764, lng: 126.993541 },
  { line: "3호선", name: "금호", count: 1, operator: "성동구청", lat: 37.548269, lng: 127.015785 },
  { line: "3호선", name: "옥수", count: 1, operator: "성동구청", lat: 37.541653, lng: 127.017303 },
  { line: "2호선", name: "상왕십리", count: 1, operator: "성동구청", lat: 37.564504, lng: 127.028872 },
  { line: "2호선", name: "성수", count: 1, operator: "성동구청", lat: 37.544628, lng: 127.055983 },
  { line: "5호선", name: "마장", count: 1, operator: "성동구청", lat: 37.566066, lng: 127.042921 },
  { line: "3호선", name: "옥수", count: 1, operator: "성동문화재단", lat: 37.541653, lng: 127.017303 },
  { line: "5호선", name: "방이", count: 1, operator: "송파구청", lat: 37.508752, lng: 127.126054 },
  { line: "5호선", name: "마천", count: 1, operator: "송파구청", lat: 37.494972, lng: 127.152784 },
  { line: "5호선", name: "거여", count: 1, operator: "송파구청", lat: 37.493208, lng: 127.143983 },
  { line: "8호선", name: "장지", count: 2, operator: "송파구청", lat: 37.478609, lng: 127.126229 },
  { line: "5호선", name: "목동", count: 1, operator: "양천구청", lat: 37.526088, lng: 126.864296 },
  { line: "5호선", name: "오목교", count: 1, operator: "양천구청", lat: 37.524557, lng: 126.875049 },
  { line: "2호선", name: "신정네거리", count: 1, operator: "양천구청", lat: 37.520218, lng: 126.852849 },
  { line: "5호선", name: "여의도", count: 1, operator: "영등포구청", lat: 37.521578, lng: 126.924318 },
  { line: "5호선", name: "양평", count: 1, operator: "영등포구청", lat: 37.525614, lng: 126.886177 },
  { line: "3호선", name: "불광", count: 1, operator: "은평구립도서관", lat: 37.610554, lng: 126.929843 },
  { line: "3호선", name: "연신내", count: 1, operator: "은평구립도서관", lat: 37.618855, lng: 126.920859 },
  { line: "6호선", name: "역촌", count: 1, operator: "은평구립도서관", lat: 37.60605, lng: 126.922764 },
  { line: "3호선", name: "녹번", count: 1, operator: "은평구립도서관", lat: 37.600882, lng: 126.935758 },
  { line: "3호선", name: "구파발", count: 1, operator: "은평구립도서관", lat: 37.636612, lng: 126.918827 },
  { line: "6호선", name: "응암", count: 1, operator: "은평구립도서관", lat: 37.59859, lng: 126.915583 },
  { line: "6호선", name: "고려대", count: 1, operator: "재단법인 성북문화재단", lat: 37.59034, lng: 127.03626 },
  { line: "6호선", name: "석계", count: 1, operator: "재단법인 성북문화재단", lat: 37.614937, lng: 127.065922 },
  { line: "6호선", name: "보문", count: 1, operator: "재단법인 성북문화재단", lat: 37.585293, lng: 127.019377 },
  { line: "6호선", name: "안암", count: 1, operator: "재단법인 성북문화재단", lat: 37.586261, lng: 127.02903 },
  { line: "6호선", name: "월곡", count: 1, operator: "재단법인 성북문화재단", lat: 37.60192, lng: 127.041492 },
  { line: "6호선", name: "돌곶이", count: 1, operator: "재단법인 성북문화재단", lat: 37.610522, lng: 127.056419 },
  { line: "4호선", name: "길음", count: 1, operator: "재단법인 성북문화재단", lat: 37.604087, lng: 127.025353 },
  { line: "4호선", name: "성신여대", count: 1, operator: "재단법인 성북문화재단", lat: 37.592782, lng: 127.017338 },
  { line: "4호선", name: "한성대입구", count: 1, operator: "재단법인 성북문화재단", lat: 37.58838, lng: 127.006751 },
  { line: "3호선", name: "안국", count: 1, operator: "정독도서관", lat: 37.576562, lng: 126.98547 },
  { line: "7호선", name: "중화", count: 1, operator: "중랑구청", lat: 37.602604, lng: 127.079254 },
  { line: "7호선", name: "용마산", count: 1, operator: "중랑구청", lat: 37.573752, lng: 127.086802 },
  { line: "7호선", name: "상봉", count: 1, operator: "중랑구청", lat: 37.595673, lng: 127.085708 },
  { line: "7호선", name: "사가정", count: 1, operator: "중랑구청", lat: 37.580912, lng: 127.088502 },
  { line: "7호선", name: "먹골", count: 1, operator: "중랑구청", lat: 37.610638, lng: 127.077719 },
  { line: "2호선", name: "충정로", count: 1, operator: "중림동주민센터", lat: 37.559742, lng: 126.964455 },
  { line: "7호선", name: "철산", count: 1, operator: "평생학습사업본부(철산도서관)", lat: 37.47616, lng: 126.868217 },
  { line: "7호선", name: "광명사거리", count: 1, operator: "평생학습사업본부(광명도서관)", lat: 37.47927, lng: 126.854854 }
    ];

    locations.forEach(loc => {
        const markerPosition = new kakao.maps.LatLng(loc.lat, loc.lng);
        const marker = new kakao.maps.Marker({ position: markerPosition, map: kakaoMap });
        const content = `
            <div class="custom-infowindow">
                <div class="info-title">${loc.name}역 스마트도서관</div>
                <div class="info-body">
                    <strong>호선:</strong> ${loc.line}<br>
                    <strong>설치대수:</strong> ${loc.count}대<br>
                    <a href="https://map.kakao.com/link/to/${loc.name}역 스마트도서관,${loc.lat},${loc.lng}" target="_blank" class="info-link">
                        <i class="fa-solid fa-route"></i> 길찾기 연결
                    </a>
                </div>
            </div>`;
        const infowindow = new kakao.maps.InfoWindow({ content: content, removable: true });
        kakao.maps.event.addListener(marker, 'click', function() {
            if (currentInfoWindow) currentInfoWindow.close();
            infowindow.open(kakaoMap, marker);
            currentInfoWindow = infowindow;
        });
    });
    setTimeout(() => { if(kakaoMap) kakaoMap.relayout(); }, 150);
}

// 4. 인기도서 10권 렌더러
function renderHotBooks() {
    const hotBooksList = document.getElementById('hot-books-list');
    if (!hotBooksList) return;
    const dummyHotBooks = [
        { rank: 1, title: "모순", author: "양귀자", publisher: "살림", count: 142 },
        { rank: 2, title: "마흔에 읽는 쇼펜하우어", author: "강용수", publisher: "유노북스", count: 128 },
        { rank: 3, title: "리틀 라이프 1", author: "한야 야나기하라", publisher: "토토북", count: 115 },
        { rank: 4, title: "생각이 너무 많은 어른들을 위한 심리학", author: "김혜남", publisher: "메이븐", count: 98 },
        { rank: 5, title: "도둑맞은 집중력", author: "요한 하리", publisher: "어크로스", count: 87 },
        { rank: 6, title: "삼국지 1", author: "설민석", publisher: "세계사", count: 76 },
        { rank: 7, title: "물고기는 존재하지 않는다", author: "룰루 밀러", publisher: "곰출판", count: 71 },
        { rank: 8, title: "원씽 (The One Thing)", author: "게리 켈러", publisher: "비즈니스북스", count: 65 },
        { rank: 9, title: "세이노의 가르침", author: "세이노", publisher: "데이원", count: 59 },
        { rank: 10, title: "데미안", author: "헤르만 헤세", publisher: "민음사", count: 52 }
    ];
    hotBooksList.innerHTML = "";
    dummyHotBooks.forEach(book => {
        const row = document.createElement('div');
        row.className = 'book-item-card';
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between;";
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 1.2rem; font-weight: 800; color: ${book.rank <= 3 ? '#e11d48' : '#64748b'}; min-width: 25px;">${book.rank}</span>
                <div>
                    <div class="book-title" style="margin:0; font-size:1rem;">${book.title}</div>
                    <div class="book-info" style="margin:2px 0 0 0; font-size:0.8rem; color:#64748b;">저자: ${book.author} | 출판사: ${book.publisher}</div>
                </div>
            </div>
            <span class="station-tag" style="background:#fff1f2; color:#e11d48; border:1px solid #ffe4e6;"><i class="fa-solid fa-fire"></i> 주간 대출 ${book.count}회</span>`;
        hotBooksList.appendChild(row);
    });
}

// 5. 🌟 게시판 내부 탭 동적 화면 변환엔진 (동민님 사진 참고)
function switchBoardTab(type) {
    const contentArea = document.getElementById('board-content-area');
    if (!contentArea) return;

    if (type === 'notice') {
        contentArea.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="background:#fff; padding:18px; border-radius:15px; border:1px solid #e2e8f0;">
                    <span style="background:#f1f5f9; color:#475569; font-size:0.75rem; padding:3px 8px; border-radius:6px; font-weight:bold;">안내</span>
                    <h4 style="margin:8px 0 4px 0; color:#1e293b; font-size:1rem;">[중요] SMILE ONE 시스템 점검 안내</h4>
                    <p style="margin:0; font-size:0.85rem; color:#64748b;">스마트도서관 실시간 위치 및 도서 동기화 서버 인프라 안정화 작업이 진행될 예정입니다.</p>
                </div>
                <div style="background:#fff; padding:18px; border-radius:15px; border:1px solid #e2e8f0;">
                    <span style="background:#f1f5f9; color:#475569; font-size:0.75rem; padding:3px 8px; border-radius:6px; font-weight:bold;">새소식</span>
                    <h4 style="margin:8px 0 4px 0; color:#1e293b; font-size:1rem;">서울 전역 스마트도서관 84개소 전수 매핑 완료</h4>
                    <p style="margin:0; font-size:0.85rem; color:#64748b;">은평구 5개 역사 외에 서울 전역의 스마트도서관 위치 정보가 100% 통합 등록되었습니다.</p>
                </div>
            </div>`;
    } else if (type === 'qna') {
        contentArea.innerHTML = `
            <div style="background:#fff; padding:20px; border-radius:15px; border:1px solid #e2e8f0; margin-bottom:15px;">
                <h4 style="margin:0 0 10px 0; color:#1e293b;"><i class="fa-solid fa-comments"></i> 1:1 서비스 만족도 및 피드백 접수</h4>
                <p style="margin:0 0 15px 0; font-size:0.85rem; color:#64748b;">어플리케이션 이용 중 발생한 불편사항이나 기능 건의사항을 남겨주시면 신속하게 반영하겠습니다.</p>
                
                <input type="text" placeholder="제목을 입력하세요" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:10px; font-family:inherit; font-size:0.9rem;">
                <textarea placeholder="피드백이나 문의사항을 상세히 작성해 주세요." rows="4" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:12px; font-family:inherit; font-size:0.9rem; resize:none;"></textarea>
                <button type="button" onclick="alert('피드백이 소중하게 접수되었습니다! 감사합니다.')" style="width:100%; background:#4a90e2; color:#fff; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">문의글 등록하기</button>
            </div>`;
    }
}

// 6. 🌟 나의 이용현황 5권 목록화 엔진 (연체일 빨간색 조건식 매칭)
function renderUserStatus() {
    const rentListContainer = document.getElementById('user-rent-list');
    if (!rentListContainer) return;

    // 대출 도서 5권 임의 매핑 데이터 (14일 기한)
    const userRentBooks = [
        { title: "도파민네이션", author: "애나 렘키", location: "불광역 스마트도서관", dDay: 5, isOverdue: false },
        { title: "트렌드 코리아 2026", author: "김난도", location: "연신내역 스마트도서관", dDay: 11, isOverdue: false },
        { title: "쇼펜하우어 아포리즘", author: "아르투어 쇼펜하우어", location: "합정역 스마트도서관", dDay: 2, isOverdue: false },
        { title: "작별하지 않는다", author: "한강", location: "시청역 스마트도서관", dDay: 7, isOverdue: false },
        { title: "검색어 : 삶의 의미", author: "박상우", location: "역촌역 스마트도서관", dDay: 4, isOverdue: true } // 연체 조건 부여
    ];

    rentListContainer.innerHTML = "";
    userRentBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-item-card';
        card.style.cssText = "display: flex; align-items: center; justify-content: space-between;";
        
        // 연체 여부에 따른 태그 및 일수 텍스트 색상 스위칭
        let statusBadge = "";
        if (book.isOverdue) {
            statusBadge = `<span class="station-tag" style="background:#fef2f2; color:#ef4444; border:1px solid #fee2e2; font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> 연체 ${book.dDay}일째</span>`;
        } else {
            statusBadge = `<span class="station-tag" style="background:#f0fdf4; color:#16a34a; border:1px solid #dcfce7;"><i class="fa-solid fa-clock"></i> 반납 D-${book.dDay}</span>`;
        }

        card.innerHTML = `
            <div>
                <div class="book-title" style="margin:0; font-size:1rem; color:${book.isOverdue ? '#b91c1c' : '#1e293b'}">${book.title}</div>
                <div class="book-info" style="margin:2px 0 0 0; font-size:0.8rem; color:#64748b;">저자: ${book.author} | 대출처: ${book.location}</div>
            </div>
            ${statusBadge}
        `;
        rentListContainer.appendChild(card);
    });
}

// 7. 통합 검색 제어 엔진
function setupSearch() {
    const searchInput = document.getElementById('book-search');
    const searchBtn = document.getElementById('search-btn');
    if(searchBtn) searchBtn.onclick = performSearch;
    if(searchInput) {
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    }
}

function performSearch() {
    const query = document.getElementById('book-search').value.trim().toLowerCase();
    if (query === "") return alert("검색어를 입력해 주세요!");

    const filteredResults = globalLibraryBooks.filter(book => {
        return book.title.toLowerCase().includes(query) || 
               book.author.toLowerCase().includes(query) || 
               book.location.toLowerCase().includes(query);
    });

    document.getElementById('main-dashboard-page').style.display = 'none';
    document.getElementById('search-results-page').style.display = 'block';
    document.getElementById('map-page').style.display = 'none';
    document.getElementById('usage-page').style.display = 'none';
    document.getElementById('hot-books-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('user-status-page').style.display = 'none';

    const resultsList = document.getElementById('results-list');
    document.getElementById('result-count').innerText = filteredResults.length;
    resultsList.innerHTML = "";

    if (filteredResults.length === 0) {
        resultsList.innerHTML = `<p style="text-align:center; color:#999; padding:40px 0;">결과가 없습니다.</p>`;
        return;
    }

    filteredResults.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-item-card';
        bookCard.innerHTML = `
            <div class="book-title">${book.title}</div>
            <div class="book-info">저자: ${book.author} | 출판사: ${book.publisher}</div>
            <span class="station-tag">📍 ${book.location} 스마트도서관</span>
        `;
        resultsList.appendChild(bookCard);
    });
    window.scrollTo(0, 0);
}