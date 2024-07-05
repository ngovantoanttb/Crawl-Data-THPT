require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { delay } = require('await-delay');

// Đọc các tham số từ file .env
const PATCH_SIZE = parseInt(process.env.PATCH_SIZE) || 100;
const PATCH_DELAY = parseFloat(process.env.PATCH_DELAY) || 0.1;
const OUTPUT_FOLDER = process.env.OUTPUT_FOLDER || './Data';

// Danh sách mã tỉnh
const provinces = {
  "01": "Tp. Hà Nội",
  "02": "Tp. Hồ Chí Minh",
  "03": "Tp. Hải Phòng",
  "04": "Tp. Đà Nẵng",
  "05": "Tỉnh Hà Giang",
  "06": "Tỉnh Cao Bằng",
  "07": "Tỉnh Lai Châu",
  "08": "Tỉnh Lào Cai",
  "09": "Tỉnh Tuyên Quang",
  "10": "Tỉnh Lạng Sơn",
  "11": "Tỉnh Bắc Kạn",
  "12": "Tỉnh Thái Nguyên",
  "13": "Tỉnh Yên Bái",
  "14": "Tỉnh Sơn La",
  "15": "Tỉnh Phú Thọ",
  "16": "Tỉnh Vĩnh Phúc",
  "17": "Tỉnh Quảng Ninh",
  "18": "Tỉnh Bắc Giang",
  "19": "Tỉnh Bắc Ninh",
  "21": "Tỉnh Hải Dương",
  "22": "Tỉnh Hưng Yên",
  "23": "Tỉnh Hòa Bình",
  "24": "Tỉnh Hà Nam",
  "25": "Tỉnh Nam Định",
  "26": "Tỉnh Thái Bình",
  "27": "Tỉnh Ninh Bình",
  "28": "Tỉnh Thanh Hóa",
  "29": "Tỉnh Nghệ An",
  "30": "Tỉnh Hà Tĩnh",
  "31": "Tỉnh Quảng Bình",
  "32": "Tỉnh Quảng Trị",
  "33": "Tỉnh Thừa Thiên Huế",
  "34": "Tỉnh Quảng Nam",
  "35": "Tỉnh Quảng Ngãi",
  "36": "Tỉnh Kon Tum",
  "37": "Tỉnh Bình Định",
  "38": "Tỉnh Gia Lai",
  "39": "Tỉnh Phú Yên",
  "40": "Tỉnh Đắk Lắk",
  "41": "Tỉnh Khánh Hòa",
  "42": "Tỉnh Lâm Đồng",
  "43": "Tỉnh Bình Phước",
  "44": "Tỉnh Bình Dương",
  "45": "Tỉnh Ninh Thuận",
  "46": "Tỉnh Tây Ninh",
  "47": "Tỉnh Bình Thuận",
  "48": "Tỉnh Đồng Nai",
  "49": "Tỉnh Long An",
  "50": "Tỉnh Đồng Tháp",
  "51": "Tỉnh An Giang",
  "52": "Tỉnh Bà Rịa - Vũng Tàu",
  "53": "Tỉnh Tiền Giang",
  "54": "Tỉnh Kiên Giang",
  "55": "Tp. Cần Thơ",
  "56": "Tỉnh Bến Tre",
  "57": "Tỉnh Vĩnh Long",
  "58": "Tỉnh Trà Vinh",
  "59": "Tỉnh Sóc Trăng",
  "60": "Tỉnh Bạc Liêu",
  "61": "Tỉnh Cà Mau",
  "62": "Tỉnh Điện Biên",
  "63": "Tỉnh Đăk Nông",
  "64": "Tỉnh Hậu Giang",
};

const outputFileList = 'crawled_files.json';

let crawledFiles = [];
if (fs.existsSync(outputFileList)) {
  const fileContent = fs.readFileSync(outputFileList);
  crawledFiles = JSON.parse(fileContent);
}

async function crawlData(provinceCode) {
  const url = `https://thanhnien.vn/giao-duc/tuyen-sinh/2021/tra-cuu-diem-thi-thpt-quoc-gia.html?province=${provinceCode}`;

  try {
    await delay(PATCH_DELAY * 1000);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const data = [];

    $('tr.student-row').each((index, element) => {
      const SBD = $(element).find('td.sbd').text().trim();
      const Ten = $(element).find('td.name').text().trim();
      const NgaySinh = $(element).find('td.dob').text().trim();
      const GioiTinh = $(element).find('td.gender').text().trim();
      const Toan = $(element).find('td.math').text().trim();
      const Van = $(element).find('td.lit').text().trim();
      const Ly = $(element).find('td.phys').text().trim();
      const Hoa = $(element).find('td.chem').text().trim();
      const Sinh = $(element).find('td.bio').text().trim();
      const KHTN = $(element).find('td.khtn').text().trim();
      const LichSu = $(element).find('td.hist').text().trim();
      const DiaLy = $(element).find('td.geo').text().trim();
      const GDCD = $(element).find('td.civic').text().trim();
      const KHXH = $(element).find('td.khxh').text().trim();
      const NgoaiNgu = $(element).find('td.lang').text().trim();

      data.push({
        SBD,
        Ten,
        NgaySinh,
        GioiTinh,
        Toan,
        Van,
        Ly,
        Hoa,
        Sinh,
        KHTN,
        LichSu,
        DiaLy,
        GDCD,
        KHXH,
        NgoaiNgu
      });
    });

    // Đảm bảo tất cả các cột đều có mặt trong dữ liệu
    const columns = ['SBD', 'Ten', 'NgaySinh', 'GioiTinh', 'Toan', 'Van', 'Ly', 'Hoa', 'Sinh', 'KHTN', 'LichSu', 'DiaLy', 'GDCD', 'KHXH', 'NgoaiNgu'];
    data.forEach(row => {
      columns.forEach(col => {
        if (!row[col]) {
          row[col] = ''; // Thêm giá trị rỗng cho cột thiếu
        }
      });
    });

    // Phân loại dữ liệu theo mã tỉnh dựa trên 2 số đầu của SBD
    const provinceData = {};
    data.forEach(row => {
      const provinceCode = row.SBD.substring(0, 2);
      if (!provinceData[provinceCode]) {
        provinceData[provinceCode] = [];
      }
      provinceData[provinceCode].push(row);
    });

    // Ghi dữ liệu vào các file Excel riêng biệt theo mã tỉnh
    for (const [provinceCode, students] of Object.entries(provinceData)) {
      // Sắp xếp dữ liệu theo SBD
      students.sort((a, b) => parseInt(a.SBD) - parseInt(b.SBD));

      // Chuẩn bị dữ liệu để ghi vào file Excel
      const excelData = [['SBD', 'TÊN', 'NGÀY SINH', 'GIOI TINH', 'TOAN', 'VAN', 'LY', 'HOA', 'SINH', 'KHTN', 'LICHSU', 'DIALY', 'GDCD', 'KHXH', 'NGOAINGU']];
      students.forEach(student => {
        excelData.push([
          student.SBD,
          student.Ten,
          student.NgaySinh,
          student.GioiTinh,
          student.Toan,
          student.Van,
          student.Ly,
          student.Hoa,
          student.Sinh,
          student.KHTN,
          student.LichSu,
          student.DiaLy,
          student.GDCD,
          student.KHXH,
          student.NgoaiNgu
        ]);
      });

      const worksheet = xlsx.utils.aoa_to_sheet(excelData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

      const fileName = `${provinceCode}.xlsx`;
      const filePath = path.join(OUTPUT_FOLDER, fileName);

      xlsx.writeFile(workbook, filePath);

      crawledFiles.push(fileName);
      fs.writeFileSync(outputFileList, JSON.stringify(crawledFiles, null, 2));

      console.log(`Dữ liệu cho mã tỉnh ${provinceCode} đã được lưu vào tệp ${filePath}`);
    }
  } catch (error) {
    console.error(`Lỗi khi crawl dữ liệu cho tỉnh ${provinces[provinceCode]}:`, error);
  }
}

(async () => {
  try {
    // Kiểm tra và tạo thư mục OUTPUT_FOLDER nếu chưa tồn tại
    if (!fs.existsSync(OUTPUT_FOLDER)) {
      fs.mkdirSync(OUTPUT_FOLDER);
    }

    // Lặp qua từng tỉnh để crawl dữ liệu và lưu vào file .xlsx
    for (const [code, name] of Object.entries(provinces)) {
      await crawlData(code);
      await delay(PATCH_DELAY * 1000);
    }
  } catch (error) {
    console.error('Lỗi khi thực hiện crawl dữ liệu:', error);
  }
})();

