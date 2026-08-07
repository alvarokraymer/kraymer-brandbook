const toggle = document.getElementById('navToggle');
const sidebar = document.getElementById('sidebar');

toggle?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.querySelectorAll('#toc a').forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
});

const sections = document.querySelectorAll('main.content section[id]');
const links = document.querySelectorAll('#toc a');

const setActive = (id) => {
  links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setActive(entry.target.id);
  });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

sections.forEach(s => observer.observe(s));
