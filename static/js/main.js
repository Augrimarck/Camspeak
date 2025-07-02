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
    const fileInput = document.getElementById("file-upload");
    const previewImage = document.getElementById("preview-image");
    const submitBtn = document.getElementById("submit-btn");

    // Modal Upload (jika kamu pakai)
    const uploadModal = document.getElementById("uploadModal");
    if (uploadModal) {
        const modal = new bootstrap.Modal(uploadModal);

        // Klik area upload -> tampilkan modal
        const uploadArea = document.getElementById("uploadArea");
        if (uploadArea) {
            uploadArea.addEventListener("click", () => modal.show());
        }

        // Tutup modal dengan baik
        uploadModal.addEventListener("hidden.bs.modal", () => {
            document.body.classList.remove("modal-open");
            let backdrop = document.querySelector(".modal-backdrop");
            if (backdrop) backdrop.remove();
        });
    }

    // Pilih "Ambil Gambar" = buka kamera
    const cameraOption = document.getElementById("camera-option");
    if (cameraOption) {
        cameraOption.addEventListener("click", function () {
            fileInput.setAttribute("capture", "environment");
            fileInput.click();
        });
    }

    // Pilih "Upload Gambar" = buka galeri/file explorer
    const uploadOption = document.getElementById("upload-option");
    if (uploadOption) {
        uploadOption.addEventListener("click", function () {
            fileInput.removeAttribute("capture");
            fileInput.click();
        });
    }

    // Preview gambar setelah pilih
    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove("d-none");
            };
            reader.readAsDataURL(file);
            submitBtn.disabled = false;
        } else {
            previewImage.classList.add("d-none");
            submitBtn.disabled = true;
        }
    });
});

// Auto-scroll ke section jika ada anchor
window.addEventListener("load", function () {
    if (window.location.hash === '#coba-sekarang') {
        const section = document.getElementById('coba-sekarang');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }
});
  
// document.addEventListener('DOMContentLoaded', function(){
//   const cameraOption = document.getElementById('camera-option');
//   const modal = new bootstrap.Modal(document.getElementById('cameraModal'));
//   const video = document.getElementById('video');
//   const captureBtn = document.getElementById('capture-btn');
//   let stream;

//   cameraOption.addEventListener('click', async function(){
//     modal.show();
//     stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     video.srcObject = stream;
//   });

//   captureBtn.addEventListener('click', async function(){
//     const canvas = document.createElement('canvas');
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     canvas.getContext('2d').drawImage(video, 0, 0);

//     // Stop kamera
//     stream.getTracks().forEach(track => track.stop());

//     // Kirim ke server
//     const imageData = canvas.toDataURL('image/png');
//     fetch('/detect_paper', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ image: imageData })
//     }).then(response => {
//       if (response.redirected) window.location.href = response.url;
//     });
//   });
// });

})();