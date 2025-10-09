/**
* Template Name: Appland
* Template URL: https://bootstrapmade.com/free-bootstrap-app-landing-page-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

  
  
  
  
  
  
  
  
  
  
  
  
  
  document.addEventListener("DOMContentLoaded", function () {
  // === Elemen umum ===
  const fileInput = document.getElementById("file-upload");
  const previewImage = document.getElementById("preview-image");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("upload-form");
  const inputOption = document.getElementById("input-option");

  // === Inisialisasi Modal Pemrosesan (BARU) ===
    const processingModalEl = document.getElementById("processingModal");
    const processingModal = new bootstrap.Modal(processingModalEl);

  // === Upload File (galeri/file explorer) ===
  const uploadOption = document.getElementById("upload-option");
  if (uploadOption) {
    uploadOption.addEventListener("click", () => {
      fileInput.removeAttribute("capture");
      fileInput.click();
    });
  }

  // === MULTI FILE PREVIEW ===
  const previewContainer = document.getElementById("preview-container");
  let uploadedFiles = [];

  function renderPreview() {
    if (!previewContainer) return;
    previewContainer.innerHTML = "";

    uploadedFiles.forEach((file, index) => {
        const fileName = file.name;
        const fileType = file.type;
        
        const wrapper = document.createElement("div");
        wrapper.className = "position-relative d-inline-block text-center mx-3 my-3"; // Tingkatkan margin
        // **PERBAIKAN 1: TINGKATKAN LEBAR WRAPPER**
        wrapper.style.width = "150px"; // Misalnya, naikkan dari 100px menjadi 150px
        wrapper.style.verticalAlign = "top";

        let previewElement;
        // **PERBAIKAN 2: TINGKATKAN UKURAN PREVIEW**
        const size = "120px"; // Misalnya, naikkan dari 80px menjadi 120px

        if (fileType.startsWith("image/")) {
            // KASUS 1: FILE ADALAH GAMBAR
            const imgURL = URL.createObjectURL(file);
            
            previewElement = document.createElement("img");
            previewElement.src = imgURL;
            previewElement.className = "img-thumbnail";
            previewElement.style.width = size;
            previewElement.style.height = size; 
            previewElement.style.objectFit = "cover";
            previewElement.style.borderRadius = '8px';

        } else if (fileType === "application/pdf") {
            // KASUS 2: FILE ADALAH PDF
            
            previewElement = document.createElement("img");
            previewElement.src = '../static/img/CamSpeak/pdf_icon.png'; 
            previewElement.alt = 'PDF Icon';
            previewElement.style.width = size; 
            previewElement.style.height = size;
            previewElement.style.objectFit = 'contain';
            previewElement.style.border = '1px solid #ddd';
            previewElement.style.padding = '5px';
            previewElement.style.borderRadius = '8px';

        } else {
            // KASUS 3: TIPE FILE LAINNYA
            previewElement = document.createElement("div");
            previewElement.innerHTML = "❌";
            previewElement.style.fontSize = "4rem"; // Sesuaikan font size agar terlihat proporsional
            previewElement.style.width = size;
            previewElement.style.height = size;
            previewElement.style.lineHeight = size;
            previewElement.style.border = '1px solid #ddd';
            previewElement.style.borderRadius = '8px';
            previewElement.style.display = 'inline-block';
        }
        
        wrapper.appendChild(previewElement);
        
        // Tambahkan Nama File
        const nameText = document.createElement("p");
        nameText.className = "file-name mt-1 text-truncate"; 
        nameText.textContent = fileName;
        nameText.title = fileName;
        nameText.style.fontSize = "0.85rem"; // Sedikit perbesar font nama file
        nameText.style.width = "100%";
        nameText.style.margin = '0';

        // Tambahkan tombol hapus
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0";
        delBtn.style.width = "25px"; // Sedikit perbesar tombol hapus
        delBtn.style.height = "25px";
        delBtn.style.fontSize = "1rem"; // Sesuaikan font size
        delBtn.style.lineHeight = "1";
        delBtn.innerHTML = "&times;";
        delBtn.addEventListener("click", () => {
            uploadedFiles.splice(index, 1);
            renderPreview();
            updateFileInput();
        });

        wrapper.appendChild(delBtn);
        wrapper.appendChild(nameText);
        previewContainer.appendChild(wrapper);
    });

    // Cek apakah ada file, lalu atur status submitBtn
    submitBtn.disabled = uploadedFiles.length === 0;
}

  function updateFileInput() {
      // Fungsi ini tetap sama, hanya untuk memastikan input file asli terupdate
      const dataTransfer = new DataTransfer();
      uploadedFiles.forEach(file => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
  }

  // === Preview file gambar/PDF ===
  fileInput.addEventListener("change", function () {
    const files = Array.from(this.files);
    if (!files.length) {
      resetPreview();
      return;
    }

    uploadedFiles = [...uploadedFiles, ...files];
    renderPreview();
  
  });

  function resetPreview() {
    if (previewContainer) previewContainer.innerHTML = "";
    uploadedFiles = [];
    submitBtn.disabled = true;
  }

  // === Jalankan OCR (multi file AJAX) ===
submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (uploadedFiles.length === 0) {
        alert("Belum ada gambar untuk diproses.");
        return;
    }

    // Tentukan endpoint sesuai pilihan user
    let endpoint = "";
    // ... (Logika penentuan endpoint Anda) ...
    if (inputOption.value === "poster") endpoint = "/poster";
    else if (inputOption.value === "buku") endpoint = "/buku";
    else {
        alert("Pilih jenis input terlebih dahulu!");
        return;
    }

    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append("files", file));

    // Nonaktifkan tombol dan tampilkan pesan sebelum memunculkan modal
    submitBtn.disabled = true;
    submitBtn.innerText = "Memproses...";
    
    // 1. TAMPILKAN MODAL NOTIFIKASI
    processingModal.show();

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        // ambil hasil HTML dari server
        const resultHTML = await response.text();

        // tampilkan hasil di halaman
        document.open();
        document.write(resultHTML);
        document.close();

    } catch (error) {
        alert("Terjadi kesalahan saat memproses OCR.");
        console.error(error);
    } finally {
        // 2. SEMBUNYIKAN MODAL NOTIFIKASI
        processingModal.hide();
        
        submitBtn.disabled = false;
        submitBtn.innerText = "Jalankan"; // Atau kembalikan ke teks asli "Jalankan"
    }
});

  // === Kamera ===
  const cameraOption = document.getElementById("camera-option");
  const cameraModalEl = document.getElementById("cameraModal");
  const cameraModal = new bootstrap.Modal(cameraModalEl);
  const previewModalEl = document.getElementById("previewModal");
  const previewModal = new bootstrap.Modal(previewModalEl);

  const video = document.getElementById("camera-stream");
  const canvas = document.getElementById("camera-canvas");
  const captureBtn = document.getElementById("capture-btn");
  const switchBtn = document.getElementById("switch-camera-btn");
  const flashBtn = document.getElementById("flash-btn");
  const flashIcon = document.getElementById("flash-icon");

  const previewPhoto = document.getElementById("preview-photo");
  const retakeBtn = document.getElementById("retake-btn");
  const savePhotoBtn = document.getElementById("save-photo-btn");
  const addPhotoBtn = document.getElementById("add-photo-btn");

  let currentStream = null;
  let currentTrack = null;
  let useFrontCamera = true;
  let useTorch = false;

  async function startCamera(facingMode = "user") {
    if (currentStream) stopCamera();

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });

      video.srcObject = currentStream;
      currentTrack = currentStream.getVideoTracks()[0];
      const capabilities = currentTrack.getCapabilities();
      flashBtn.disabled = !capabilities.torch;
    } catch (err) {
      alert("Tidak bisa mengakses kamera: " + err.message);
    }
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  cameraOption.addEventListener("click", () => {
    cameraModal.show();
    startCamera(useFrontCamera ? "user" : "environment");
  });

  switchBtn.addEventListener("click", () => {
    useFrontCamera = !useFrontCamera;
    startCamera(useFrontCamera ? "user" : "environment");
  });

  captureBtn.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL("image/png");
  previewPhoto.src = dataURL;

  // Hapus class d-none agar gambar tampil
  previewPhoto.classList.remove("d-none");

  cameraModal.hide();
  setTimeout(() => previewModal.show(), 400);
});


  savePhotoBtn.addEventListener("click", () => {
    fetch(previewPhoto.src)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `camera-capture-${Date.now()}.png`, { type: "image/png" });
        uploadedFiles.push(file);
        renderPreview();
        updateFileInput();
      });
  });

  if (addPhotoBtn) {
    addPhotoBtn.addEventListener("click", () => {
      previewModal.hide();
      setTimeout(() => {
        cameraModal.show();
        startCamera(useFrontCamera ? "user" : "environment");
      }, 400);
    });
  }

  flashBtn.addEventListener("click", async () => {
    if (!currentTrack) return;
    useTorch = !useTorch;
    try {
      await currentTrack.applyConstraints({ advanced: [{ torch: useTorch }] });
      flashIcon.src = useTorch
        ? "static/img/CamSpeak/Flash On.png"
        : "static/img/CamSpeak/Flash Off.png";
    } catch (err) {
      console.warn("Torch tidak didukung:", err);
    }
  });

  cameraModalEl.addEventListener("hidden.bs.modal", stopCamera);

  retakeBtn.addEventListener("click", () => {
    previewModal.hide();
    setTimeout(() => {
      cameraModal.show();
      startCamera(useFrontCamera ? "user" : "environment");
    }, 400);
  });

  // === OCR Pagination (jika hasil sudah muncul) ===
  const pages = document.querySelectorAll(".ocr-page");
  if (pages.length) {
    let currentPage = 1;
    const totalPages = pages.length;

    function showPage(n) {
      pages.forEach((p, idx) => {
        p.classList.toggle("d-block", idx + 1 === n);
        p.classList.toggle("d-none", idx + 1 !== n);
      });
      currentPage = n;
    }

    document.getElementById("prevPage").addEventListener("click", () => {
      if (currentPage > 1) showPage(currentPage - 1);
    });

    document.getElementById("nextPage").addEventListener("click", () => {
      if (currentPage < totalPages) showPage(currentPage + 1);
    });

    showPage(1);
  }
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const submitBtn = document.getElementById("submit-btn");
    const spinner = document.getElementById("loading-spinner");

    if (form) {
      form.addEventListener("submit", function () {
        // Nonaktifkan tombol agar tidak diklik dua kali
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Memproses...";

        // Tampilkan spinner
        spinner.classList.remove("d-none");
      });
    }
  });

})();
