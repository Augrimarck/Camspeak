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
    const pdfInfo = document.getElementById("pdf-info");
    const submitBtn = document.getElementById("submit-btn");
    const form = document.getElementById("upload-form");
    const inputOption = document.getElementById("input-option");

    // === Opsi Upload File (galeri/file explorer) ===
    const uploadOption = document.getElementById("upload-option");
    if (uploadOption) {
        uploadOption.addEventListener("click", function () {
            fileInput.removeAttribute("capture"); // biar gak otomatis buka kamera di HP
            fileInput.click(); // buka file explorer
        });
    }

    // === Preview file gambar/PDF ===
    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const fileType = file.type;
            if (fileType.startsWith("image/")) {
                // Kalau gambar
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                    previewImage.classList.remove("d-none");
                };
                reader.readAsDataURL(file);
                pdfInfo.textContent = "";
            } else if (fileType === "application/pdf") {
                // Kalau PDF
                previewImage.classList.add("d-none");
                previewImage.src = "#";
                pdfInfo.textContent = `📄 File PDF terpilih: ${file.name}`;
            }
            submitBtn.disabled = false;
        } else {
            previewImage.classList.add("d-none");
            previewImage.src = "#";
            pdfInfo.textContent = "";
            submitBtn.disabled = true;
        }
    });

    // === Tentukan action form sesuai pilihan input ===
    form.addEventListener("submit", function (e) {
        if (inputOption.value === "poster") {
            form.action = "/poster";
        } else if (inputOption.value === "buku") {
            form.action = "/buku";
        } else {
            e.preventDefault();
            alert("Pilih jenis input terlebih dahulu!");
        }
    });

    // === Auto-scroll ke section jika ada anchor ===
    if (window.location.hash === '#coba-sekarang') {
        const section = document.getElementById('coba-sekarang');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // === Kamera ===
    const cameraOption = document.getElementById("camera-option");
    const cameraModal = new bootstrap.Modal(document.getElementById("cameraModal"));
    const video = document.getElementById("camera-stream");
    const canvas = document.getElementById("camera-canvas");
    const captureBtn = document.getElementById("capture-btn");
    const hiddenInput = document.getElementById("camera-image"); // hidden input untuk simpan data foto

    let stream = null;

    // Klik tombol "Ambil Gambar" -> buka modal kamera
    cameraOption.addEventListener("click", async () => {
        cameraModal.show();
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.classList.remove("d-none");
            canvas.classList.add("d-none");
        } catch (err) {
            alert("Tidak bisa mengakses kamera: " + err);
        }
    });

    // Tombol "Ambil Foto"
    captureBtn.addEventListener("click", () => {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Tampilkan hasil foto di modal
        video.classList.add("d-none");
        canvas.classList.remove("d-none");

        // Ambil hasil sebagai dataURL
        const dataURL = canvas.toDataURL("image/png");

        // ✅ Tampilkan di preview luar modal
        previewImage.src = dataURL;
        previewImage.classList.remove("d-none");

        // ✅ Simpan ke hidden input (biar bisa dikirim ke server)
        hiddenInput.value = dataURL;

        // ✅ Buat file blob supaya bisa ikut dikirim lewat <form> (fallback)
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "camera-capture.png", { type: "image/png" });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;

                submitBtn.disabled = false; // aktifkan submit
            });
    });

    // Saat modal ditutup -> hentikan kamera
    document.getElementById("cameraModal").addEventListener("hidden.bs.modal", () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});

})();