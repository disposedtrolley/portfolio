import { marked } from 'marked';
import { initStrip, loadProject } from './strip.js';
import data from '../data.json';

const siteTitle = document.getElementById('site-title');
const projectList = document.getElementById('project-list');
const aboutLink = document.getElementById('about-link');
const projectView = document.getElementById('project-view');
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

function showProject(projectId) {
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;

  projectView.hidden = false;
  aboutView.hidden = true;
  aboutLink.classList.remove('active');

  document.querySelectorAll('#project-list a').forEach(a => {
    a.classList.toggle('active', a.dataset.id === projectId);
  });

  loadProject(project);
  closeSidebar();
}

function showAbout() {
  projectView.hidden = true;
  aboutView.hidden = false;
  aboutLink.classList.add('active');
  document.querySelectorAll('#project-list a').forEach(a => a.classList.remove('active'));
  closeSidebar();
}

function route() {
  const hash = window.location.hash;
  if (hash === '#about') {
    showAbout();
  } else if (hash.startsWith('#project/')) {
    showProject(hash.slice('#project/'.length));
  } else {
    const first = data.projects[0];
    if (first) showProject(first.id);
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
