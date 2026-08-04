(() => {
  'use strict';

  const form = document.querySelector('#family-request-form');
  if (!form) return;

  const nameInput = document.querySelector('#name');
  const phoneInput = document.querySelector('#phone');
  const error = document.querySelector('#form-error');
  const result = document.querySelector('#request-result');
  const smsLink = document.querySelector('#sms-link');
  const copyButton = document.querySelector('#copy-link');
  const shareButton = document.querySelector('#share-link');
  const requestLinkField = document.querySelector('#request-link');
  const copyStatus = document.querySelector('#copy-status');
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let requestLink = '';
  let shareText = '';

  function randomBase64Url(byteLength) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function encodeBase64Url(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function validate() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.replace(/\D/g, '');
    nameInput.removeAttribute('aria-invalid');
    phoneInput.removeAttribute('aria-invalid');

    if (nameInput.value.length > 100 || name.length < 1 || name.length > 30 || /[\u0000-\u001f\u007f]/.test(name)) {
      nameInput.setAttribute('aria-invalid', 'true');
      return { message: '이름을 1~30자로 입력해주세요.' };
    }
    if (phoneInput.value.length > 40 || (phone.length !== 10 && phone.length !== 11)) {
      phoneInput.setAttribute('aria-invalid', 'true');
      return { message: '휴대폰 번호를 확인해주세요.' };
    }
    return { name, phone };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    result.classList.remove('is-visible');
    copyStatus.textContent = '';

    const values = validate();
    if (values.message) {
      error.textContent = values.message;
      return;
    }

    const createdAt = Date.now();
    const payload = {
      id: randomBase64Url(16),
      nonce: randomBase64Url(32),
      createdAt,
      expiresAt: createdAt + sevenDays,
      name: values.name,
      phone: values.phone,
    };
    requestLink = `https://useportapp.com/family/complete#v1.r.${encodeBase64Url(payload)}`;
    shareText = `포트 가족 등록 요청입니다.\n\n아래 링크를 포트가 설치된 휴대폰에서 눌러\n가족 등록을 확인해주세요.\n\n${requestLink}`;

    requestLinkField.value = requestLink;
    smsLink.href = `sms:?&body=${encodeURIComponent(shareText)}`;
    result.classList.add('is-visible');
  });

  copyButton.addEventListener('click', async () => {
    if (!requestLink) return;
    try {
      await navigator.clipboard.writeText(requestLink);
      copyStatus.textContent = '링크를 복사했어요. 포트 사용자에게 카카오톡이나 문자로 보내주세요.';
    } catch (_) {
      requestLinkField.focus();
      requestLinkField.select();
      copyStatus.textContent = '링크를 길게 눌러 복사해주세요.';
    }
  });

  shareButton.addEventListener('click', async () => {
    if (!requestLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (shareError) {
        if (shareError.name === 'AbortError') return;
      }
    }
    requestLinkField.focus();
    requestLinkField.select();
    copyStatus.textContent = '공유 기능을 열 수 없어요. 링크를 복사해 보내주세요.';
  });
})();
