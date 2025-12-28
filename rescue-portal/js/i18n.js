// ═══════════════════════════════════════════════════════════════
//                    DRECS - Internationalization
// ═══════════════════════════════════════════════════════════════

/**
 * Vietnamese language strings
 * Future: can add more languages
 */

const i18n = {
    vi: {
        // App
        appName: 'DRECS - Cứu Hộ Khẩn Cấp',
        appTitle: 'CỨU HỘ KHẨN CẤP',
        
        // Status
        connected: 'Đã kết nối',
        disconnected: 'Không có mạng',
        
        // Panic
        panicButton: 'CẦN CỨU NGAY',
        panicHint: 'Nhấn nếu rất khẩn cấp',
        
        // Form
        orFillForm: 'HOẶC ĐIỀN THÔNG TIN',
        
        // Fields
        location: 'Vị trí của bạn',
        locationLoading: 'Đang lấy vị trí...',
        locationError: 'Không lấy được vị trí',
        locationManual: 'Nhập tọa độ: vd: 16.4637, 107.5909',
        
        peopleCount: 'Số người cần cứu',
        
        urgency: 'Mức độ khẩn cấp',
        urgencyLow: 'Thấp',
        urgencyMedium: 'Trung bình',
        urgencyHigh: 'Khẩn cấp',
        
        injured: 'Có người bị thương?',
        yes: 'CÓ',
        no: 'KHÔNG',
        
        waterLevel: 'Mực nước hiện tại',
        
        foodAvailable: 'Còn lương thực?',
        foodYes: 'CÒN',
        foodNo: 'HẾT',
        
        phone: 'Số điện thoại',
        phoneHint: '(tùy chọn)',
        phonePlaceholder: 'VD: 0901234567',
        
        submit: 'GỬI YÊU CẦU CỨU HỘ',
        
        // Confirmation
        requestReceived: 'ĐÃ NHẬN YÊU CẦU',
        yourCode: 'Mã của bạn:',
        keepCode: 'Giữ mã này để theo dõi',
        infoSent: 'Thông tin đã gửi:',
        waitingResponse: 'Đang chờ phản hồi từ trung tâm...',
        newRequest: 'Gửi yêu cầu mới',
        
        // Response
        rescueNotification: 'THÔNG BÁO CỨU HỘ',
        teamArriving: 'Đội cứu hộ sẽ đến trong',
        minutes: 'phút',
        vehicle: 'Phương tiện',
        direction: 'Hướng đến',
        instructions: 'HƯỚNG DẪN',
        understood: 'ĐÃ HIỂU',
        needMoreHelp: 'Cần hỗ trợ thêm',
        
        // Vehicles
        vehicleBoat: 'Xuồng',
        vehicleHelicopter: 'Trực thăng',
        vehicleFoot: 'Đội bộ',
        vehicleTruck: 'Xe cứu hộ',
        
        // Offline
        offlineNotice: 'Không có mạng - Yêu cầu sẽ được gửi khi có kết nối',
        willSendWhenOnline: 'Đã lưu - sẽ gửi khi có mạng',
        
        // Errors
        errorGeneral: 'Có lỗi xảy ra. Vui lòng thử lại.',
        errorGpsPermission: 'Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt',
        errorGpsUnavailable: 'Không thể xác định vị trí. Thử lại hoặc nhập tay.',
        errorGpsTimeout: 'Hết thời gian chờ. Thử lại.',
        errorInvalidPhone: 'Số điện thoại không hợp lệ',
        errorSelectPeople: 'Vui lòng chọn số người cần cứu',
        errorInvalidCoords: 'Tọa độ không hợp lệ. VD: 16.4637, 107.5909',
        
        // Footer
        version: 'DRECS v1.0 • Hệ thống cứu hộ khẩn cấp'
    }
};

// Current language
const currentLang = 'vi';

// Get translation
function t(key) {
    const keys = key.split('.');
    let value = i18n[currentLang];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            console.warn(`[i18n] Missing translation: ${key}`);
            return key;
        }
    }
    
    return value;
}

console.log('[DRECS] i18n.js loaded');
