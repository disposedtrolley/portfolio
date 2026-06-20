import { marked } from 'marked';
import { initStrip, loadProject } from './strip.js';
import { initCanvas, loadScrapbook } from './canvas.js';
import data from '../data.json';

const siteTitle = document.getElementById('site-title');
const projectList = document.getElementById('project-list');
const aboutLink = document.getElementById('about-link');
const scrapbookLink = document.getElementById('scrapbook-link');
const projectView = document.getElementById('project-view');
const scrapbookView = document.getElementById('scrapbook-view');
const aboutView = document.getElementById('about-view');
const aboutContent = document.getElementById('about-content');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');

// ── Site metadata ──

document.title = data.meta.title;
siteTitle.textContent = data.meta.title;

if (data.meta.bio) {
  aboutContent.innerHTML = marked.parse(data.meta.bio);
}

initStrip();
initCanvas();

// ── Mobile sidebar ──

function openSidebar() {
  sidebar.classList.add('open');
  backdrop.classList.add('visible');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  backdrop.classList.remove('visible');
}

menuBtn.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);

// ── Routing ──

function hideAll() {
  projectView.hidden = true;
  scrapbookView.hidden = true;
  aboutView.hidden = true;
  aboutLink.classList.remove('active');
  scrapbookLink.classList.remove('active');
  document.querySelectorAll('#project-list a').forEach(a => a.classList.remove('active'));
}

function showProject(projectId) {
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  hideAll();
  projectView.hidden = false;
  document.querySelectorAll('#project-list a').forEach(a => {
    a.classList.toggle('active', a.dataset.id === projectId);
  });
  loadProject(project);
  closeSidebar();
}

function showScrapbook() {
  hideAll();
  scrapbookView.hidden = false;
  scrapbookLink.classList.add('active');
  loadScrapbook(data.scrapbook);
  closeSidebar();
}

function showAbout() {
  hideAll();
  aboutView.hidden = false;
  aboutLink.classList.add('active');
  closeSidebar();
}

function route() {
  const hash = window.location.hash;
  if (hash === '#about') {
    showAbout();
  } else if (hash === '#scrapbook') {
    showScrapbook();
  } else if (hash.startsWith('#project/')) {
    showProject(hash.slice('#project/'.length));
  } else {
    showScrapbook();
  }
}

// ── Sidebar links ──

for (const project of data.projects) {
  const a = document.createElement('a');
  a.textContent = project.title;
  a.dataset.id = project.id;
  a.href = `#project/${project.id}`;
  projectList.appendChild(a);
}

window.addEventListener('hashchange', route);
route();
