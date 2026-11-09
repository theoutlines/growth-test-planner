// Answer pages: mark wide tables that scroll sideways, so page.css shows the edge fade and the swipe hint only when there is more to see.
for (const w of document.querySelectorAll('.tblw')) {
  const t = w.querySelector('.tbl');
  const check = () => {
    const more = t.scrollWidth > t.clientWidth + 1;
    w.classList.toggle('has-more', more);
    w.classList.toggle('at-end', more && t.scrollLeft + t.clientWidth >= t.scrollWidth - 1);
  };
  t.addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);
  check();
}
