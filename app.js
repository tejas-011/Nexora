(function () {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('#site-nav');
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const opening = !siteNav.classList.contains('is-open');
      siteNav.classList.toggle('is-open', opening);
      menuToggle.setAttribute('aria-expanded', String(opening));
      menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    });
    siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll('[data-enquiry]').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem('contact-interest', link.dataset.enquiry);
    });
  });

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const interest = document.querySelector('#contact-interest');
    const feedback = document.querySelector('#contact-feedback');
    const submitButton = contactForm.querySelector('[type="submit"]');
    const requestedInterest = new URLSearchParams(location.search).get('interest') || sessionStorage.getItem('contact-interest');
    if (requestedInterest && interest && interest.querySelector(`option[value="${requestedInterest}"]`)) {
      interest.value = requestedInterest;
    }
    sessionStorage.removeItem('contact-interest');

    contactForm.addEventListener('submit', async event => {
      if (location.protocol === 'file:') {
        if (feedback) feedback.textContent = 'Sending your enquiry...';
        return;
      }

      event.preventDefault();
      if (feedback) feedback.textContent = '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      try {
        const response = await fetch('/api/enquiries', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (!response.ok && result.saved) {
          if (feedback) feedback.textContent = result.message;
          contactForm.reset();
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof result.message === 'string' && result.message
              ? result.message
              : 'The server did not accept the submission.'
          );
        }

        const emailAction = contactForm.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
        try {
          const emailResponse = await fetch(emailAction, {
              method: 'POST',
              body: new FormData(contactForm),
              headers: { Accept: 'application/json' },
              signal: AbortSignal.timeout(15000)
          });
          const emailResult = await emailResponse.json();
          if (!emailResponse.ok || (emailResult.success !== 'true' && emailResult.success !== true)) {
              throw new Error(
                typeof emailResult.message === 'string' && emailResult.message
                  ? emailResult.message
                  : 'The email service did not accept the submission.'
              );
          }
          if (feedback) feedback.textContent = 'Your enquiry was emailed successfully. Thanks for reaching out; we’ll be in touch soon.';
          contactForm.reset();
        } catch (error) {
          console.error('Enquiry saved, but email delivery failed:', error);
          if (feedback) {
              feedback.textContent = "Your enquiry was saved, but we couldn't email it. Please contact us directly.";
          }
        }
      } catch (error) {
        console.error('Contact form submission failed:', error);
        if (feedback) {
          feedback.textContent = error instanceof Error && error.message
            ? `We couldn't send your message: ${error.message}`
            : "We couldn't send your message. Please try again in a moment.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Send enquiry <span aria-hidden="true">↗</span>';
        }
      }
    });
  }

  const projectsApp = document.querySelector('#project-grid');
  if (projectsApp) {
    const projectSearch = document.querySelector('#project-search');
    const projectCount = document.querySelector('#project-count');
    const projectsEmpty = document.querySelector('#projects-empty');
    const loadMoreButton = document.querySelector('#load-more-projects');
    const projectDialog = document.querySelector('#project-dialog');
    const projectDialogContent = document.querySelector('#project-dialog-content');
    const projectPageSize = 6;
    let allProjects = [];
    let activeCategory = 'All Projects';
    let visibleProjectCount = projectPageSize;

    const createTextElement = (tagName, className, text) => {
      const element = document.createElement(tagName);
      if (className) element.className = className;
      element.textContent = text;
      return element;
    };

    const createImagePlaceholder = () => {
      const imagePlaceholder = document.createElement('div');
      imagePlaceholder.className = 'project-image-placeholder';
      imagePlaceholder.setAttribute('aria-hidden', 'true');
      imagePlaceholder.append(createTextElement('span', '', 'Project preview'));
      return imagePlaceholder;
    };

    const safeAssetUrl = value => {
      if (typeof value !== 'string' || !value.trim()) return null;
      try {
        const url = new URL(value, location.href);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (url.origin !== location.origin && url.protocol !== 'https:') return null;
        return url.href;
      } catch {
        return null;
      }
    };

    const validateProjects = projects => {
      const categories = new Set(['Web Development', 'Mobile Apps', 'Software Solutions', 'IoT', 'Other']);
      const statuses = new Set(['Completed', 'In Progress']);
      const ids = new Set();

      if (!Array.isArray(projects)) throw new Error('The project data must be a JSON array.');
      projects.forEach((project, index) => {
        if (!project || typeof project !== 'object' || Array.isArray(project)) {
          throw new Error(`Project ${index + 1} must be an object.`);
        }
        if (typeof project.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(project.id) || ids.has(project.id)) {
          throw new Error(`Project ${index + 1} needs a unique, lowercase id using letters, numbers, and hyphens.`);
        }
        ids.add(project.id);
        if (typeof project.name !== 'string' || !project.name.trim()
          || typeof project.shortDescription !== 'string' || !project.shortDescription.trim()
          || typeof project.description !== 'string' || !project.description.trim()) {
          throw new Error(`Project "${project.id}" needs a name, shortDescription, and description.`);
        }
        const projectCategories = Array.isArray(project.categories) && project.categories.length
          ? project.categories
          : [project.category].filter(Boolean);
        if (!projectCategories.length || projectCategories.some(category => !categories.has(category))) {
          throw new Error(`Project "${project.id}" has an unsupported category.`);
        }
        if (project.status !== undefined && !statuses.has(project.status)) {
          throw new Error(`Project "${project.id}" status must be "Completed" or "In Progress".`);
        }
        if (project.isSample !== undefined && typeof project.isSample !== 'boolean') {
          throw new Error(`Project "${project.id}" isSample must be true or false.`);
        }
        if (!Array.isArray(project.technologies) || !project.technologies.every(item => typeof item === 'string')) {
          throw new Error(`Project "${project.id}" technologies must be an array of strings.`);
        }
        if (project.features !== undefined
          && (!Array.isArray(project.features) || !project.features.every(item => typeof item === 'string'))) {
          throw new Error(`Project "${project.id}" features must be an array of strings.`);
        }
        if (project.screenshots !== undefined
          && (!Array.isArray(project.screenshots) || project.screenshots.some(item => !item || typeof item.src !== 'string'))) {
          throw new Error(`Project "${project.id}" screenshots must be an array of objects with a src.`);
        }
        if (project.links !== undefined
          && (!Array.isArray(project.links) || project.links.some(item => !item || typeof item.label !== 'string' || typeof item.url !== 'string'))) {
          throw new Error(`Project "${project.id}" links must be an array of objects with a label and url.`);
        }
      });
      return projects;
    };

    const showProjectState = (message, isError = false, allowRetry = false) => {
      if (!projectsEmpty) return;
      projectsEmpty.replaceChildren();
      projectsEmpty.className = `projects-empty${isError ? ' is-error' : ''}`;
      projectsEmpty.append(createTextElement('p', 'projects-empty-title', isError ? 'Projects couldn’t be loaded' : 'No projects found'));
      projectsEmpty.append(createTextElement('p', 'projects-empty-message', message));
      if (allowRetry) {
        const retryButton = createTextElement('button', 'button button-dark', 'Try again');
        retryButton.type = 'button';
        retryButton.addEventListener('click', loadProjects);
        projectsEmpty.append(retryButton);
      }
      projectsEmpty.hidden = false;
    };

    const createProjectCard = project => {
      const card = document.createElement('article');
      card.className = 'project-card';
      const media = document.createElement('div');
      media.className = 'project-card-media';
      const imageUrl = safeAssetUrl(project.image);
      if (imageUrl) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = project.imageAlt || `${project.name} project`;
        image.loading = 'lazy';
        image.addEventListener('error', () => media.replaceChildren(createImagePlaceholder()), { once: true });
        media.append(image);
      } else {
        media.append(createImagePlaceholder());
      }

      const badges = document.createElement('div');
      badges.className = 'project-card-badges';
      const categories = Array.isArray(project.categories) && project.categories.length
        ? project.categories
        : [project.category].filter(Boolean);
      categories.forEach(category => badges.append(createTextElement('span', 'project-category', category)));
      if (project.isSample) {
        badges.append(createTextElement('span', 'project-sample-badge', 'Sample project'));
      } else if (project.status) {
        badges.append(createTextElement('span', `project-status${project.status === 'In Progress' ? ' is-progress' : ''}`, project.status));
      }
      media.append(badges);

      const content = document.createElement('div');
      content.className = 'project-card-content';
      content.append(createTextElement('h3', 'project-card-title', project.name));
      content.append(createTextElement('p', 'project-card-description', project.shortDescription));
      const technologyList = document.createElement('ul');
      technologyList.className = 'project-tech-list';
      technologyList.setAttribute('aria-label', 'Technologies');
      project.technologies.forEach(technology => technologyList.append(createTextElement('li', '', technology)));
      content.append(technologyList);
      const detailsButton = createTextElement('button', 'project-view-button', 'View details');
      detailsButton.type = 'button';
      detailsButton.addEventListener('click', () => openProjectDetails(project));
      content.append(detailsButton);

      card.append(media, content);
      return card;
    };

    const getFilteredProjects = () => {
      const query = (projectSearch ? projectSearch.value : '').trim().toLocaleLowerCase();
      return allProjects.filter(project => {
        const projectCategories = Array.isArray(project.categories) && project.categories.length
          ? project.categories
          : [project.category].filter(Boolean);
        const categoryMatches = activeCategory === 'All Projects' || projectCategories.includes(activeCategory);
        const searchText = `${project.name} ${project.technologies.join(' ')}`.toLocaleLowerCase();
        return categoryMatches && (!query || searchText.includes(query));
      });
    };

    const renderProjects = () => {
      const matches = getFilteredProjects();
      const visibleProjects = matches.slice(0, visibleProjectCount);
      projectsApp.replaceChildren(...visibleProjects.map(createProjectCard));
      projectsApp.setAttribute('aria-busy', 'false');
      if (projectCount) {
        projectCount.textContent = matches.length
          ? `Showing ${visibleProjects.length} of ${matches.length} ${matches.length === 1 ? 'project' : 'projects'}`
          : '';
      }
      if (loadMoreButton) {
        loadMoreButton.hidden = visibleProjects.length >= matches.length;
      }
      if (projectsEmpty) {
        projectsEmpty.hidden = matches.length > 0;
        if (!matches.length) {
          const hasProjects = allProjects.length > 0;
          showProjectState(
            hasProjects
              ? 'Try another search or category to find a matching project.'
              : 'There are no published projects yet. Add approved project information to the seed data and run npm run seed.'
          );
        }
      }
    };

    const appendProjectLinks = (container, links) => {
      const validLinks = links.filter(link => {
        try {
          const url = new URL(link.url, location.href);
          return url.protocol === 'https:' || url.protocol === 'http:';
        } catch {
          return false;
        }
      });
      if (!validLinks.length) return;
      const heading = createTextElement('h3', '', 'Project links');
      const list = document.createElement('div');
      list.className = 'project-dialog-links';
      validLinks.forEach(link => {
        const url = new URL(link.url, location.href);
        const anchor = createTextElement('a', 'button button-dark', link.label);
        anchor.href = url.href;
        if (url.origin !== location.origin) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        }
        list.append(anchor);
      });
      container.append(heading, list);
    };

    function openProjectDetails(project) {
      if (!projectDialog || !projectDialogContent) return;
      projectDialogContent.replaceChildren();
      const header = document.createElement('div');
      header.className = 'project-dialog-header';
      const categories = Array.isArray(project.categories) && project.categories.length
        ? project.categories
        : [project.category].filter(Boolean);
      categories.forEach(category => header.append(createTextElement('span', 'project-category', category)));
      if (project.isSample) {
        header.append(createTextElement('span', 'project-sample-badge', 'Sample project'));
      } else if (project.status) {
        header.append(createTextElement('span', `project-status${project.status === 'In Progress' ? ' is-progress' : ''}`, project.status));
      }
      projectDialogContent.append(header, createTextElement('h2', '', project.name));
      projectDialogContent.lastChild.id = 'project-dialog-title';
      projectDialogContent.append(createTextElement('p', 'project-dialog-description', project.description));

      const technologies = document.createElement('section');
      technologies.append(createTextElement('h3', '', 'Technologies'));
      const techList = document.createElement('ul');
      techList.className = 'project-tech-list';
      project.technologies.forEach(technology => techList.append(createTextElement('li', '', technology)));
      technologies.append(techList);
      projectDialogContent.append(technologies);

      if (project.features && project.features.length) {
        const features = document.createElement('section');
        features.append(createTextElement('h3', '', project.isSample ? 'Example capabilities' : 'Features'));
        const featureList = document.createElement('ul');
        featureList.className = 'project-feature-list';
        project.features.forEach(feature => featureList.append(createTextElement('li', '', feature)));
        features.append(featureList);
        projectDialogContent.append(features);
      }

      const screenshots = (project.screenshots || []).filter(item => safeAssetUrl(item.src));
      if (screenshots.length) {
        const gallery = document.createElement('section');
        gallery.append(createTextElement('h3', '', 'Screenshots'));
        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'project-screenshot-grid';
        screenshots.forEach(item => {
          const image = document.createElement('img');
          image.src = safeAssetUrl(item.src);
          image.alt = item.alt || `${project.name} screenshot`;
          image.loading = 'lazy';
          galleryGrid.append(image);
        });
        gallery.append(galleryGrid);
        projectDialogContent.append(gallery);
      }
      appendProjectLinks(projectDialogContent, project.links || []);
      projectDialog.showModal();
    }

    async function loadProjects() {
      if (projectsEmpty) {
        projectsEmpty.hidden = true;
        projectsEmpty.replaceChildren(createTextElement('p', 'projects-loading', 'Loading projects…'));
        projectsEmpty.hidden = false;
        projectsEmpty.className = 'projects-empty is-loading';
      }
      projectsApp.replaceChildren();
      projectsApp.setAttribute('aria-busy', 'true');
      if (loadMoreButton) loadMoreButton.hidden = true;
      if (projectCount) projectCount.textContent = '';
      try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        if (!response.ok) throw new Error(projects.message || 'The server could not load projects.');
        allProjects = validateProjects(projects);
        visibleProjectCount = projectPageSize;
        if (projectsEmpty) projectsEmpty.hidden = true;
        renderProjects();
      } catch (error) {
        console.warn('Could not load project data from API, checking local fallback:', error);
        if (Array.isArray(window.NEXORA_PROJECT_DATA) && window.NEXORA_PROJECT_DATA.length > 0) {
          try {
            allProjects = validateProjects(window.NEXORA_PROJECT_DATA);
            visibleProjectCount = projectPageSize;
            if (projectsEmpty) projectsEmpty.hidden = true;
            renderProjects();
            return;
          } catch (fallbackError) {
            console.error('Fallback projects validation failed:', fallbackError);
          }
        }
        projectsApp.setAttribute('aria-busy', 'false');
        showProjectState(
          error instanceof Error ? error.message : 'Could not load projects. Try again.',
          true,
          true
        );
      }
    }

    document.querySelectorAll('.project-filter').forEach(button => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.category;
        visibleProjectCount = projectPageSize;
        document.querySelectorAll('.project-filter').forEach(filter => {
          const selected = filter === button;
          filter.classList.toggle('is-active', selected);
          filter.setAttribute('aria-pressed', String(selected));
        });
        renderProjects();
      });
    });
    if (projectSearch) {
      projectSearch.addEventListener('input', () => {
        visibleProjectCount = projectPageSize;
        renderProjects();
      });
    }
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => {
        visibleProjectCount += projectPageSize;
        renderProjects();
      });
    }
    const projectCloseButton = document.querySelector('.project-dialog-close');
    if (projectCloseButton && projectDialog) {
      projectCloseButton.addEventListener('click', () => projectDialog.close());
    }
    if (projectDialog) {
      projectDialog.addEventListener('click', event => {
        if (event.target === projectDialog) projectDialog.close();
      });
    }
    loadProjects();
  }

  const teamGrid = document.querySelector('#team-grid');
  if (teamGrid) {
    const teamSearch = document.querySelector('#team-search');
    const teamCount = document.querySelector('#team-count');
    const teamEmpty = document.querySelector('#team-empty');
    const teamDialog = document.querySelector('#team-dialog');
    const teamDialogContent = document.querySelector('#team-dialog-content');
    let teamMembers = [];
    let activeDepartment = 'All Departments';

    const createTeamText = (tagName, className, text) => {
      const element = document.createElement(tagName);
      if (className) element.className = className;
      element.textContent = text;
      return element;
    };

    const validateTeamMembers = members => {
      const departments = new Set([
        'Management',
        'Development',
        'Design',
        'QA & Testing',
        'Quality Assurance',
        'Infrastructure',
        'Database & Infrastructure'
      ]);
      const ids = new Set();
      if (!Array.isArray(members)) throw new Error('Team data must be a JSON array.');
      members.forEach((member, index) => {
        if (!member || typeof member !== 'object' || Array.isArray(member)) {
          throw new Error(`Team profile ${index + 1} must be an object.`);
        }
        if (typeof member.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(member.id) || ids.has(member.id)) {
          throw new Error(`Team profile ${index + 1} needs a unique lowercase id using letters, numbers, and hyphens.`);
        }
        ids.add(member.id);
        if (typeof member.name !== 'string' || !member.name.trim()
          || typeof member.role !== 'string' || !member.role.trim()
          || typeof member.department !== 'string' || !departments.has(member.department)
          || typeof member.shortBio !== 'string' || !member.shortBio.trim()
          || typeof member.bio !== 'string' || !member.bio.trim()
          || !Array.isArray(member.skills) || !member.skills.every(skill => typeof skill === 'string')) {
          throw new Error(`Team profile "${member.id}" has missing or invalid required fields.`);
        }
        if (typeof member.isSample !== 'boolean') {
          throw new Error(`Team profile "${member.id}" must identify whether it is sample content.`);
        }
      });
      return members;
    };

    const showTeamError = message => {
      if (!teamEmpty) return;
      teamEmpty.replaceChildren(
        createTeamText('p', 'team-empty-title', 'Team profiles couldn’t be loaded'),
        createTeamText('p', 'team-empty-message', message)
      );
      const retryButton = createTeamText('button', 'button button-dark', 'Try again');
      retryButton.type = 'button';
      retryButton.addEventListener('click', loadTeam);
      teamEmpty.append(retryButton);
      teamEmpty.className = 'team-empty is-error';
      teamEmpty.hidden = false;
    };

    const safeTeamPhoto = value => {
      if (typeof value !== 'string' || !value.trim()) return null;
      try {
        const url = new URL(value, location.href);
        return url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === location.origin)
          ? url.href
          : null;
      } catch {
        return null;
      }
    };

    const createTeamAvatar = member => {
      const avatar = document.createElement('div');
      avatar.className = 'team-avatar';
      avatar.setAttribute('role', 'img');
      avatar.setAttribute('aria-label', `Initials avatar for ${member.name}`);
      const photoUrl = safeTeamPhoto(member.profilePhoto);
      if (photoUrl) {
        const image = document.createElement('img');
        image.src = photoUrl;
        image.alt = `${member.name} profile`;
        image.loading = 'lazy';
        image.addEventListener('error', () => {
          avatar.replaceChildren(createTeamText('span', 'team-avatar-initials', member.avatar || 'P'));
          avatar.classList.add('is-initials');
        }, { once: true });
        avatar.append(image);
      } else {
        avatar.classList.add('is-initials');
        avatar.append(createTeamText('span', 'team-avatar-initials', member.avatar || 'P'));
      }
      avatar.append(createTeamText('span', 'team-avatar-caption', photoUrl ? 'Profile photo' : 'Initials avatar'));
      return avatar;
    };

    const safeExternalProfile = value => {
      if (typeof value !== 'string' || !value.trim()) return null;
      try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : null;
      } catch {
        return null;
      }
    };

    const createLinkedInLink = value => {
      const url = safeExternalProfile(value);
      if (!url) return null;
      const link = document.createElement('a');
      link.className = 'team-social-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'LinkedIn profile');
      link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v10M5 5v.01M10 19v-6a4 4 0 0 1 8 0v6M10 10v9"/></svg>';
      return link;
    };

    const createTeamCard = member => {
      const card = document.createElement('article');
      card.className = 'team-card';
      card.append(createTeamAvatar(member));
      const details = document.createElement('div');
      details.className = 'team-card-content';
      if (member.isSample) details.append(createTeamText('span', 'team-sample-badge', 'Sample profile'));
      details.append(createTeamText('h3', 'team-card-name', member.name));
      details.append(createTeamText('p', 'team-card-role', member.role));
      details.append(createTeamText('p', 'team-card-department', member.department));
      details.append(createTeamText('p', 'team-card-bio', member.shortBio));
      const skills = document.createElement('ul');
      skills.className = 'team-skill-list';
      skills.setAttribute('aria-label', 'Areas of expertise');
      member.skills.forEach(skill => skills.append(createTeamText('li', '', skill)));
      details.append(skills);
      const footer = document.createElement('div');
      footer.className = 'team-card-footer';
      const profileButton = createTeamText('button', 'team-view-button', 'View profile');
      profileButton.type = 'button';
      profileButton.addEventListener('click', () => openTeamProfile(member));
      footer.append(profileButton);
      const linkedIn = createLinkedInLink(member.linkedin);
      if (linkedIn) footer.append(linkedIn);
      details.append(footer);
      card.append(details);
      return card;
    };

    const renderTeam = () => {
      const query = (teamSearch ? teamSearch.value : '').trim().toLocaleLowerCase();
      const filteredMembers = teamMembers.filter(member => {
        const departmentMatches = activeDepartment === 'All Departments'
          || (activeDepartment === 'QA & Testing' && ['QA & Testing', 'Quality Assurance'].includes(member.department))
          || (activeDepartment === 'Infrastructure' && ['Infrastructure', 'Database & Infrastructure'].includes(member.department))
          || member.department === activeDepartment;
        const searchData = `${member.name} ${member.role} ${member.department} ${member.skills.join(' ')}`.toLocaleLowerCase();
        return departmentMatches && (!query || searchData.includes(query));
      });
      teamGrid.replaceChildren(...filteredMembers.map(createTeamCard));
      teamGrid.setAttribute('aria-busy', 'false');
      if (teamCount) {
        teamCount.textContent = filteredMembers.length
          ? `Showing ${filteredMembers.length} of ${teamMembers.length} team ${teamMembers.length === 1 ? 'member' : 'members'}`
          : '';
      }
      if (teamEmpty) {
        teamEmpty.hidden = filteredMembers.length > 0;
        if (!filteredMembers.length) {
          teamEmpty.className = 'team-empty';
          teamEmpty.replaceChildren(
            createTeamText('p', 'team-empty-title', 'No team members found'),
            createTeamText('p', 'team-empty-message', teamMembers.length
              ? 'Try another search or department.'
              : 'No team profiles are available yet.')
          );
        }
      }
    };

    function openTeamProfile(member) {
      if (!teamDialog || !teamDialogContent) return;
      teamDialogContent.replaceChildren();
      const header = document.createElement('div');
      header.className = 'team-dialog-header';
      header.append(createTeamAvatar(member));
      const identity = document.createElement('div');
      if (member.isSample) identity.append(createTeamText('span', 'team-sample-badge', 'Sample profile'));
      identity.append(createTeamText('h2', '', member.name));
      identity.lastChild.id = 'team-dialog-title';
      identity.append(createTeamText('p', 'team-card-role', member.role));
      identity.append(createTeamText('p', 'team-card-department', member.department));
      header.append(identity);
      teamDialogContent.append(header);
      if (member.isSample) {
        const notice = createTeamText('p', 'team-profile-notice', 'This is fictional sample profile content for demonstrating the team page, not a real employee profile.');
        teamDialogContent.append(notice);
      }
      teamDialogContent.append(createTeamText('p', 'team-dialog-bio', member.bio));
      const skillsSection = document.createElement('section');
      skillsSection.append(createTeamText('h3', '', 'Skills & expertise'));
      const skills = document.createElement('ul');
      skills.className = 'team-profile-skills';
      member.skills.forEach(skill => skills.append(createTeamText('li', '', skill)));
      skillsSection.append(skills);
      teamDialogContent.append(skillsSection);
      const profileLinks = document.createElement('div');
      profileLinks.className = 'team-profile-links';
      const linkedIn = createLinkedInLink(member.linkedin);
      if (linkedIn) profileLinks.append(linkedIn);
      if (typeof member.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        const emailLink = createTeamText('a', 'inline-link', 'Email this team member');
        emailLink.href = `mailto:${member.email}`;
        profileLinks.append(emailLink);
      }
      if (profileLinks.childElementCount) teamDialogContent.append(profileLinks);
      teamDialog.showModal();
    }

    async function loadTeam() {
      if (teamEmpty) {
        teamEmpty.hidden = false;
        teamEmpty.className = 'team-empty is-loading';
        teamEmpty.replaceChildren(createTeamText('p', 'team-loading', 'Loading team profiles…'));
      }
      teamGrid.replaceChildren();
      teamGrid.setAttribute('aria-busy', 'true');
      if (teamCount) teamCount.textContent = '';
      try {
        const response = await fetch('/api/team');
        const members = await response.json();
        if (!response.ok) throw new Error(members.message || 'The server could not load team profiles.');
        teamMembers = validateTeamMembers(members);
        if (teamEmpty) teamEmpty.hidden = true;
        renderTeam();
      } catch (error) {
        console.warn('Could not load team profiles from API, checking local fallback:', error);
        if (Array.isArray(window.NEXORA_TEAM_DATA) && window.NEXORA_TEAM_DATA.length > 0) {
          try {
            teamMembers = validateTeamMembers(window.NEXORA_TEAM_DATA);
            if (teamEmpty) teamEmpty.hidden = true;
            renderTeam();
            return;
          } catch (fallbackError) {
            console.error('Fallback team validation failed:', fallbackError);
          }
        }
        teamGrid.setAttribute('aria-busy', 'false');
        showTeamError(error instanceof Error ? error.message : 'Could not load team profiles. Try again.');
      }
    }

    document.querySelectorAll('.team-filter').forEach(button => {
      button.addEventListener('click', () => {
        activeDepartment = button.dataset.department;
        document.querySelectorAll('.team-filter').forEach(filter => {
          const selected = filter === button;
          filter.classList.toggle('is-active', selected);
          filter.setAttribute('aria-pressed', String(selected));
        });
        renderTeam();
      });
    });
    if (teamSearch) {
      teamSearch.addEventListener('input', renderTeam);
    }
    const teamCloseButton = document.querySelector('.team-dialog-close');
    if (teamCloseButton && teamDialog) {
      teamCloseButton.addEventListener('click', () => teamDialog.close());
    }
    if (teamDialog) {
      teamDialog.addEventListener('click', event => {
        if (event.target === teamDialog) teamDialog.close();
      });
    }
    loadTeam();
  }

  const revealTargets = document.querySelectorAll(
    '.section-heading, .home-service, .service-detail, .service-expanded, .project-card, .team-card, .industry-detail-list article, .insight-article, .values-grid article, .career-path-grid > a, .feature-image, .feature-copy, .story-copy, .story-image, .career-story > div, .contact-page-copy, .contact-form, .process-steps > div, .sector-preview-list a, .insight-links a, .careers-preview-inner > div, .home-contact-inner > *, .about-cta-inner > *, .career-cta-inner > *, .career-feature-copy, .career-spotlight, .footer-main > *'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((element, index) => {
      element.classList.add('reveal');
      element.classList.add(index % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right');
      element.style.transitionDelay = `${(index % 4) * 70}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  }
})();
