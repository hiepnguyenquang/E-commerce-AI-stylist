// slide/export-pdf.js
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Đang khởi động trình duyệt không đầu để xuất PDF...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Đường dẫn tuyệt đối tới file index.html
    const filePath = path.resolve(__dirname, 'index.html');
    const fileUrl = `file://${filePath}`;
    console.log(`Đang tải slide từ: ${fileUrl}`);
    
    // Nạp trang slide
    await page.goto(fileUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Thiết lập kích thước viewport chuẩn 16:9
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 2 // Tăng chất lượng ảnh chụp/chữ sắc nét hơn
    });
    
    const outputPath = path.resolve(__dirname, 'slides.pdf');
    console.log(`Đang xuất file PDF lưu tại: ${outputPath}`);
    
    // Xuất PDF với kích thước chuẩn landscape 13.333in x 7.5in và margin bằng 0
    await page.pdf({
      path: outputPath,
      width: '13.333in',
      height: '7.5in',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });
    
    console.log('Xuất file PDF thành công!');
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
