import about from '../../about.html?raw';
import careers from '../../careers.html?raw';
import contact from '../../contact.html?raw';
import index from '../../index.html?raw';
import industries from '../../industries.html?raw';
import insights from '../../insights.html?raw';
import projects from '../../projects.html?raw';
import serviceDetails from '../../service-details.html?raw';
import services from '../../services.html?raw';
import team from '../../team.html?raw';

const pages = {
  '/': index,
  '/index': index,
  '/index.html': index,
  '/about': about,
  '/about.html': about,
  '/careers': careers,
  '/careers.html': careers,
  '/contact': contact,
  '/contact.html': contact,
  '/industries': industries,
  '/industries.html': industries,
  '/insights': insights,
  '/insights.html': insights,
  '/projects': projects,
  '/projects.html': projects,
  '/service-details': serviceDetails,
  '/service-details.html': serviceDetails,
  '/services': services,
  '/services.html': services,
  '/team': team,
  '/team.html': team
};

export function getPage(pathname) {
  const clean = (pathname || '/').replace(/\/$/, '') || '/';
  const withHtml = clean.endsWith('.html') ? clean : `${clean}.html`;
  const withoutHtml = clean.replace(/\.html$/, '');

  return pages[clean] || pages[withHtml] || pages[withoutHtml] || pages['/'];
}
