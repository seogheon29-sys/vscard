(() => {
  "use strict";

  // 스크립트가 중복으로 포함되어도 이벤트는 한 번만 등록합니다.
  const root = document.querySelector(".layout");
  if (!root || root.dataset.webcardInitialized === "true") return;
  root.dataset.webcardInitialized = "true";

  // 명함의 연락처는 이곳에서 변경합니다.
  const PROFILE = Object.freeze({
    name: "이석헌",
    job: "Full Stack Developer",
    email: "hello@example.com",
    phone: "010-1234-5678"
  });

  // Keep the embedded profile image available if cat1.* is not found locally.
  const embeddedAvatar = document.getElementById("avatar")?.getAttribute("src");
  const DEFAULT_IMAGES = [
    "./cat1.jpg",
    "./cat1.jpeg",
    "./cat1.png",
    "./cat1.webp",
    ...(embeddedAvatar ? [embeddedAvatar] : [])
  ];
  const STORAGE_KEY = "webcard_custom_avatar_v1";
  const $ = (id) => document.getElementById(id);

  let toastTimer;
  let imageLoadSequence = 0;

  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }

  function getCustomImage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function showFallback() {
    $("avatar").hidden = true;
    $("avatarFallback").hidden = false;
  }

  function showImage(src) {
    $("avatar").src = src;
    $("avatar").hidden = false;
    $("avatarFallback").hidden = true;
  }

  function loadAvatar() {
    const seq = ++imageLoadSequence;
    const custom = getCustomImage();
    const candidates = custom ? [custom, ...DEFAULT_IMAGES] : DEFAULT_IMAGES;

    $("resetImage").hidden = !custom;
    showFallback();

    function tryNext(index) {
      if (seq !== imageLoadSequence) return;
      if (index >= candidates.length) {
        showFallback();
        console.warn("기본 프로필 이미지(cat1.jpg/png 등)를 찾지 못했습니다.");
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (seq === imageLoadSequence) showImage(candidates[index]);
      };
      image.onerror = () => tryNext(index + 1);
      image.src = candidates[index];
    }

    tryNext(0);
  }

  function render() {
    $("name").textContent = PROFILE.name;
    $("job").textContent = PROFILE.job;
    $("email").textContent = PROFILE.email;
    $("phone").textContent = PROFILE.phone;
    $("emailLink").href = `mailto:${PROFILE.email}`;
    const phone = PROFILE.phone.replace(/[^\d+]/g, "");
    $("phoneLink").href = `tel:${phone}`;
    $("avatarFallback").textContent = Array.from(PROFILE.name.trim())[0] || "?";
    document.title = `${PROFILE.name} | 웹명함`;
    loadAvatar();
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("이미지 형식이 올바르지 않습니다."));
        image.onload = () => {
          try {
            const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("캔버스를 만들지 못했습니다.");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } catch (error) {
            reject(error);
          }
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // 로컬 파일 환경에서는 아래 대체 방식 시도
      }
    }
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.readOnly = true;
    temp.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      temp.remove();
    }
    return copied;
  }

  // 다른 이벤트 오류로 인해 프로필 영역이 비지 않도록 우선 렌더링합니다.
  render();

  $("uploadButton")?.addEventListener("click", () => $("imageInput")?.click());

  $("imageInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("10MB 이하의 이미지를 선택해 주세요.");
      return;
    }
    try {
      const image = await resizeImage(file);
      try {
        localStorage.setItem(STORAGE_KEY, image);
        loadAvatar();
        toast("프로필 이미지가 이 브라우저에 저장되었습니다.");
      } catch {
        ++imageLoadSequence;
        showImage(image);
        toast("사진은 변경됐지만 브라우저에 저장하지 못했습니다.");
      }
    } catch {
      toast("이미지를 처리하지 못했습니다.");
    }
  });

  $("resetImage")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      toast("저장된 이미지를 삭제하지 못했습니다.");
      return;
    }
    loadAvatar();
    toast("기본 이미지(cat1)로 복원했습니다.");
  });

  // 기존 HTML 버튼 ID를 유지합니다: saveContact / shareCard
  $("saveContact")?.addEventListener("click", () => {
    window.location.href = `mailto:${PROFILE.email}`;
  });

  $("shareCard")?.addEventListener("click", () => {
    const phone = PROFILE.phone.replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  });

  // 연락처 행의 이메일 클릭은 기존처럼 주소 복사로 동작합니다.
  $("emailLink")?.addEventListener("click", async (event) => {
    event.preventDefault();
    const copied = await copyText(PROFILE.email);
    toast(copied ? `이메일 주소(${PROFILE.email})가 복사되었습니다.` : "이메일 주소를 복사하지 못했습니다.");
  });

  // GitHub 링크는 HTML <a href>가 직접 처리하며 별도 JS 이벤트가 필요하지 않습니다.
  // 기존 버튼의 크기와 색을 바꾸지 않고 네온 클래스만 붙입니다.
  document.querySelectorAll(".actions .btn").forEach((button) => {
    let timer;
    button.addEventListener("click", () => {
      button.classList.add("is-glowing");
      clearTimeout(timer);
      timer = setTimeout(() => button.classList.remove("is-glowing"), 700);
    });
  });
})();
