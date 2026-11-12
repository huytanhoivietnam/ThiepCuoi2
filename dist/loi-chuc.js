function initWeddingWishFeed(endpoint, album, container) {
  let wishes = [];
  let nearby = false;
  let request;
  let hasLoaded = false;
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Lời chúc gửi cô dâu chú rể');

  function showStatus(message, retry = false) {
    const status = document.createElement('div');
    status.className = 'wish-status';
    status.textContent = message;
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wish-retry';
      button.textContent = 'Thử lại';
      button.addEventListener('click', event => {
        event.stopPropagation();
        refresh(true);
      });
      status.append(button);
    }
    container.replaceChildren(status);
  }

  function createWish(wish) {
    const bubble = document.createElement('div');
    bubble.className = 'bub';
    const name = document.createElement('b');
    name.textContent = wish.name;
    const message = document.createElement('span');
    message.textContent = wish.msg;
    bubble.append(name, ': ', message);
    return bubble;
  }

  function render() {
    if (!wishes.length) {
      showStatus('Gửi lời chúc của bạn ở phần Xác nhận tham dự ♥');
      return;
    }
    const track = document.createElement('div');
    track.className = 'wish-track';
    const group = document.createElement('div');
    group.className = 'wish-group';
    wishes.forEach(wish => group.append(createWish(wish)));
    track.append(group);
    container.replaceChildren(track);

    // Each copy fills the short viewport so the loop never leaves a blank gap.
    const height = group.getBoundingClientRect().height;
    if (height > 0) {
      const copies = Math.max(1, Math.ceil((container.clientHeight + 40) / height));
      for (let i = 1; i < copies; i++) {
        wishes.forEach(wish => group.append(createWish(wish)));
      }
    }
    const duplicate = group.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    track.append(duplicate);
    track.style.setProperty('--wish-duration', Math.max(1, group.getBoundingClientRect().height / 22) + 's');
  }

  async function refresh(afterSubmission = false) {
    if (request && !afterSubmission) return;
    if (request) request.abort();
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    if (!wishes.length) showStatus('Đang tải lời chúc…');
    try {
      if (!endpoint) throw new Error('Chưa có nơi nhận lời chúc');
      const url = new URL(endpoint);
      url.searchParams.set('action', 'wishes');
      const response = await fetch(url, {cache: 'no-store', signal: controller.signal});
      if (!response.ok) throw new Error('Không đọc được lời chúc');
      const data = await response.json();
      if (!Array.isArray(data.wishes)) throw new Error('Phản hồi chưa có danh sách lời chúc');
      if (request !== controller) return;
      const seen = new Set();
      const next = data.wishes.filter(wish => {
        if (!wish || typeof wish.name !== 'string' || typeof wish.msg !== 'string') return false;
        if (!wish.name.trim() || !wish.msg.trim()) return false;
        const key = JSON.stringify([wish.name.trim(), wish.msg.trim()]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const changed = JSON.stringify(next) !== JSON.stringify(wishes);
      wishes = next;
      if (changed || !hasLoaded || !wishes.length) render();
      hasLoaded = true;
    } catch (error) {
      if (request === controller && !wishes.length) {
        showStatus('Chưa tải được lời chúc.', true);
      }
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
    }
  }

  function refreshIfVisible() {
    const active = nearby && !document.hidden;
    container.classList.toggle('wish-paused', !active);
    if (active) refresh();
  }
  let width = container.clientWidth;
  new ResizeObserver(() => {
    if (container.clientWidth === width) return;
    width = container.clientWidth;
    if (wishes.length) render();
  }).observe(container);
  showStatus('Đang tải lời chúc…');
  refresh();
  new IntersectionObserver(([entry]) => {
    nearby = entry.isIntersecting;
    refreshIfVisible();
  }, {rootMargin: '200px'}).observe(album);
  document.addEventListener('visibilitychange', refreshIfVisible);
  setInterval(refreshIfVisible, 30000);
  return refresh;
}
