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

  
  
  
  
  
  
  
  
  
  
  
  
  
// static/js/main.js
document.addEventListener("DOMContentLoaded", function () {
  // === Elemen umum ===
  const fileInput = document.getElementById("file-upload");
  const previewImage = document.getElementById("preview-image");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("upload-form");
  const inputOption = document.getElementById("input-option");
  const cameraDirect = document.getElementById("camera-direct"); // input capture (mobile)
  
  // === Inisialisasi Modal Pemrosesan (BARU) ===
  const processingModalEl = document.getElementById("processingModal");
  const processingModal = new bootstrap.Modal(processingModalEl);

  // === Audio Player Universal untuk Semua Tombol "Jelaskan" ===
  const playAudioBtns = document.querySelectorAll(".play-audio-btn");

  playAudioBtns.forEach(button => {
      button.addEventListener("click", function (e) {
          e.preventDefault();
          const parentDiv = this.closest('.faq-item') || this.closest('section');
          const audioPlayer = parentDiv ? parentDiv.querySelector('.audio-player') : null;
          const buttonSpan = this.querySelector('span');

          if (!audioPlayer) {
              console.error("Audio player tidak ditemukan untuk tombol ini.");
              return;
          }

          if (audioPlayer.paused) {
              document.querySelectorAll('.audio-player').forEach(player => {
                  if (player !== audioPlayer && !player.paused) {
                      player.pause();
                      player.currentTime = 0;
                      const otherButtonSpan = player.closest('.faq-item, section')?.querySelector('.play-audio-btn span');
                      if (otherButtonSpan) otherButtonSpan.textContent = "Jelaskan";
                  }
              });
              audioPlayer.play().catch(error => {
                  console.error("Gagal memutar audio:", error);
                  alert("Gagal memutar audio. Pastikan Anda sudah berinteraksi dengan halaman.");
              });
              buttonSpan.textContent = "Hentikan";
          } else {
              audioPlayer.pause();
              audioPlayer.currentTime = 0;
              buttonSpan.textContent = "Jelaskan";
          }
      });

      const parentDiv = button.closest('.faq-item') || button.closest('section');
      const audioPlayer = parentDiv ? parentDiv.querySelector('.audio-player') : null;
      if (audioPlayer) {
          audioPlayer.addEventListener('ended', function() {
              button.querySelector('span').textContent = "Jelaskan";
          });
      }
  });
  // === Akhir Audio Player Universal ===
    
  // === Upload File (galeri/file explorer) ===
  const uploadOption = document.getElementById("upload-option");
  if (uploadOption) {
    uploadOption.addEventListener("click", () => {
      // ensure normal fileInput (galeri) - remove capture attribute
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
        wrapper.className = "position-relative d-inline-block text-center mx-3 my-3";
        wrapper.style.width = "150px";
        wrapper.style.verticalAlign = "top";

        let previewElement;
        const size = "120px";

        if (fileType.startsWith("image/")) {
            const imgURL = URL.createObjectURL(file);
            previewElement = document.createElement("img");
            previewElement.src = imgURL;
            previewElement.className = "img-thumbnail";
            previewElement.style.width = size;
            previewElement.style.height = size; 
            previewElement.style.objectFit = "cover";
            previewElement.style.borderRadius = '8px';
        } else if (fileType === "application/pdf") {
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
            previewElement = document.createElement("div");
            previewElement.innerHTML = "❌";
            previewElement.style.fontSize = "4rem";
            previewElement.style.width = size;
            previewElement.style.height = size;
            previewElement.style.lineHeight = size;
            previewElement.style.border = '1px solid #ddd';
            previewElement.style.borderRadius = '8px';
            previewElement.style.display = 'inline-block';
        }
        
        wrapper.appendChild(previewElement);
        
        const nameText = document.createElement("p");
        nameText.className = "file-name mt-1 text-truncate"; 
        nameText.textContent = fileName;
        nameText.title = fileName;
        nameText.style.fontSize = "0.85rem";
        nameText.style.width = "100%";
        nameText.style.margin = '0';

        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0";
        delBtn.style.width = "25px";
        delBtn.style.height = "25px";
        delBtn.style.fontSize = "1rem";
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

    submitBtn.disabled = uploadedFiles.length === 0;
  }

  function updateFileInput() {
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
    
    const endpoint = "/buku";
    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append("files", file));

    submitBtn.disabled = true;
    submitBtn.innerText = "Memproses...";
    processingModal.show();

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });
        const resultHTML = await response.text();
        document.open();
        document.write(resultHTML);
        document.close();
    } catch (error) {
        alert("Terjadi kesalahan saat memproses OCR.");
        console.error(error);
    } finally {
        processingModal.hide();
        submitBtn.disabled = false;
        submitBtn.innerText = "Jalankan";
    }
  });

  // === Kamera WebRTC (modal) ===
  const cameraOption = document.getElementById("camera-option");
  const cameraModalEl = document.getElementById("cameraModal");
  const cameraModal = cameraModalEl ? new bootstrap.Modal(cameraModalEl) : null;
  const previewModalEl = document.getElementById("previewModal");
  const previewModal = previewModalEl ? new bootstrap.Modal(previewModalEl) : null;

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

  function getHighResConstraints(facingMode) {
    return {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },

        // === PRIORITAS RESOLUSI TINGGI ===
        width:  { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },

        // === STABILITAS OCR ===
        frameRate: { ideal: 30, max: 30 }
      }
    };
  }

  async function startCamera(facingMode = "user") {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (currentStream) stopCamera();

    try {
      // === Coba resolusi tinggi dulu ===
      currentStream = await navigator.mediaDevices.getUserMedia(
        getHighResConstraints(facingMode)
      );
    } catch (err) {
      console.warn("Resolusi tinggi gagal, fallback ke default:", err);

      // === Fallback aman ===
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
    }

    if (video) video.srcObject = currentStream;

    currentTrack = currentStream.getVideoTracks()[0];

    // === Torch support ===
    const capabilities = currentTrack.getCapabilities?.() || {};
    if (flashBtn) flashBtn.disabled = !capabilities.torch;
  }
  
  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  // === Helper: detect mobile ===
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  // === Camera option click: pilih otomatis antara direct capture (mobile) atau WebRTC modal (desktop) ===
  if (cameraOption) {
    cameraOption.addEventListener("click", (e) => {
      if (isMobile && cameraDirect) {
        // buka kamera native (capture)
        cameraDirect.click();
      } else {
        // desktop/laptop -> modal WebRTC
        if (cameraModal) {
          cameraModal.show();
          startCamera(useFrontCamera ? "user" : "environment");
        }
      }
    });
  }

  // === Handle direct camera capture (mobile) ===
  if (cameraDirect) {
    cameraDirect.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // simpan file ke uploadedFiles lalu render preview + update hidden file input
      uploadedFiles.push(file);
      renderPreview();
      updateFileInput();

      // enable submit
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  // WebRTC: switch camera
  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      useFrontCamera = !useFrontCamera;
      startCamera(useFrontCamera ? "user" : "environment");
    });
  }

  // WebRTC: capture dengan Cropping sesuai kotak bidik
  if (captureBtn) {
      captureBtn.addEventListener("click", () => {
          if (!video || !canvas) return;

          const ctx = canvas.getContext("2d");

          // 1. Dapatkan ukuran asli video dari hardware
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          // 2. Dapatkan ukuran tampilan video di layar (CSS)
          const displayWidth = video.clientWidth;
          const displayHeight = video.clientHeight;

          // 3. Tentukan ukuran "Kotak Bidik" (Overlay)
          // Jika kotak bidik Anda di CSS adalah 80% dari lebar layar:
          const cropWidthDisplay = displayWidth * 0.8; 
          const cropHeightDisplay = displayHeight * 0.6; // Sesuaikan dengan CSS Anda

          // 4. Hitung Rasio antara ukuran Asli vs Tampilan
          const scaleX = videoWidth / displayWidth;
          const scaleY = videoHeight / displayHeight;

          // 5. Hitung koordinat cropping dalam ukuran asli video
          // (Menempatkan kotak di tengah-tengah)
          const sourceX = (displayWidth - cropWidthDisplay) / 2 * scaleX;
          const sourceY = (displayHeight - cropHeightDisplay) / 2 * scaleY;
          const sourceWidth = cropWidthDisplay * scaleX;
          const sourceHeight = cropHeightDisplay * scaleY;

          // 6. Atur ukuran canvas sesuai hasil crop
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;

          // 7. Gambar bagian yang dipotong saja ke canvas
          ctx.drawImage(
              video,
              sourceX, sourceY, sourceWidth, sourceHeight, // Bagian asal (crop)
              0, 0, sourceWidth, sourceHeight              // Bagian tujuan (canvas)
          );

          const dataURL = canvas.toDataURL("image/png");
          if (previewPhoto) {
              previewPhoto.src = dataURL;
              previewPhoto.classList.remove("d-none");
          }

          // Sembunyikan modal kamera, tampilkan modal preview
          if (cameraModal) cameraModal.hide();
          if (previewModal) setTimeout(() => previewModal.show(), 400);
      });
  }

  // Save photo from preview modal into uploadedFiles
  if (savePhotoBtn) {
    savePhotoBtn.addEventListener("click", () => {
      if (!previewPhoto) return;
      fetch(previewPhoto.src)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-capture-${Date.now()}.png`, { type: "image/png" });
          uploadedFiles.push(file);
          renderPreview();
          updateFileInput();
        });
    });
  }

  // Add photo (reopen camera modal)
  if (addPhotoBtn) {
    addPhotoBtn.addEventListener("click", () => {
      if (previewModal) previewModal.hide();
      setTimeout(() => {
        if (cameraModal) {
          cameraModal.show();
          startCamera(useFrontCamera ? "user" : "environment");
        }
      }, 400);
    });
  }

  // Torch / flash btn
  if (flashBtn) {
    flashBtn.addEventListener("click", async () => {
      if (!currentTrack) return;
      useTorch = !useTorch;
      try {
        await currentTrack.applyConstraints({ advanced: [{ torch: useTorch }] });
        if (flashIcon) flashIcon.src = useTorch ? "static/img/CamSpeak/Flash On.png" : "static/img/CamSpeak/Flash Off.png";
      } catch (err) {
        console.warn("Torch tidak didukung:", err);
      }
    });
  }

  // === TAP TO FOCUS DENGAN EFEK ANDROID (hanya untuk WebRTC modal) ===
  const focusRing = document.getElementById("focus-ring");
  if (video && focusRing) {
    video.addEventListener("click", async (event) => {
      if (!currentTrack) return;
      const capabilities = currentTrack.getCapabilities();

      // Hitung posisi tap
      const rect = video.getBoundingClientRect();
      const tapX = event.clientX - rect.left;
      const tapY = event.clientY - rect.top;

      // Tampilkan efek fokus (UI)
      focusRing.style.left = `${tapX}px`;
      focusRing.style.top = `${tapY}px`;
      focusRing.style.opacity = "1";
      focusRing.style.transform = "translate(-50%, -50%) scale(1)";
      setTimeout(() => {
        focusRing.style.opacity = "0";
        focusRing.style.transform = "translate(-50%, -50%) scale(1.2)";
      }, 800);

      // Fokus hardware (jika didukung)
      if (capabilities.focusMode && capabilities.focusMode.includes("single-shot")) {
        const focusX = tapX / rect.width;
        const focusY = tapY / rect.height;
        try {
          await currentTrack.applyConstraints({
            advanced: [{
              focusMode: "single-shot",
              pointsOfInterest: [{ x: focusX, y: focusY }]
            }]
          });
        } catch (err) {
          console.warn("Tidak bisa set fokus:", err);
        }
      } else {
        console.warn("Device tidak mendukung manual focus.");
      }
    });
  }

  if (cameraModalEl) {
    cameraModalEl.addEventListener("hidden.bs.modal", stopCamera);
  }

  if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
      if (previewModal) previewModal.hide();
      setTimeout(() => {
        if (cameraModal) {
          cameraModal.show();
          startCamera(useFrontCamera ? "user" : "environment");
        }
      }, 400);
    });
  }

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

    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    if (prevBtn) prevBtn.addEventListener("click", () => { if (currentPage > 1) showPage(currentPage - 1); });
    if (nextBtn) nextBtn.addEventListener("click", () => { if (currentPage < totalPages) showPage(currentPage + 1); });

    showPage(1);
  }

  // === Optional: prevent double-binding if script reloaded ===
  // (no-op here, but keeps file idempotent)

}); // end DOMContentLoaded

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
