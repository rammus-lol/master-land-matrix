  let currentSlide = 0;
  const slides = [
    '../../images/tutorial/test.png',
    '../../images/tutorial/test2.png',
    // add more slide image paths as needed
  ];

  // Check if tutorial was previously closed
  const tutorialClosed = localStorage.getItem('tutorialClosed') === 'true';

  if (!tutorialClosed) {
    // Load the tutorial content from the template
    fetch('../src/templates/tutorial-content.html')
      .then(response => response.text())
      .then(html => {
        const tutorialDiv = document.getElementById('tutorial-content');
        tutorialDiv.innerHTML = html;
        tutorialDiv.classList.remove('hidden');
        tutorialDiv.classList.add('visible');
        
        // Setup event listeners after the content is loaded
        setupTutorialEvents();
        updateSlide();
      })
      .catch(error => {
        console.error('Error loading tutorial content:', error);
      });
  }

  function setupTutorialEvents() {
    // Close button
    const closeBtn = document.getElementById('close-tutorial');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        const tutorialDiv = document.getElementById('tutorial-content');
        tutorialDiv.classList.remove('visible');
        tutorialDiv.classList.add('hidden');
      });
    }
    
    // Don't show again button
    const dontShowBtn = document.getElementById('dont-show-again');
    if (dontShowBtn) {
      dontShowBtn.addEventListener('click', function() {
        const tutorialDiv = document.getElementById('tutorial-content');
        tutorialDiv.classList.remove('visible');
        tutorialDiv.classList.add('hidden');
        // Store that tutorial should not show again
        localStorage.setItem('tutorialClosed', 'true');
      });
    }
    
    // Next button
    const nextBtn = document.getElementById('next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (currentSlide < slides.length - 1) {
          currentSlide++;
          updateSlide();
        }
      });
    }
    
    // Previous button
    const prevBtn = document.getElementById('previous');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (currentSlide > 0) {
          currentSlide--;
          updateSlide();
        }
      });
    }
  }

  function showTutorialAgain() {
    // Clear the localStorage flag to show tutorial again
    localStorage.removeItem('tutorialClosed');
    
    // Load the tutorial content
    fetch('../src/templates/tutorial-content.html')
      .then(response => response.text())
      .then(html => {
        const tutorialDiv = document.getElementById('tutorial-content');
        tutorialDiv.innerHTML = html;
        tutorialDiv.classList.remove('hidden');
        tutorialDiv.classList.add('visible');
        currentSlide = 0;
        
        // Setup event listeners after the content is loaded
        setupTutorialEvents();
        updateSlide();
      })
      .catch(error => {
        console.error('Error loading tutorial content:', error);
      });
  }

  // Add event listener for show tutorial button
  document.addEventListener('DOMContentLoaded', function() {
    const showTutorialBtn = document.getElementById('showTutorial');
    if (showTutorialBtn) {
      showTutorialBtn.addEventListener('click', showTutorialAgain);
    }
  });

  function updateSlide() {
    const image = document.getElementById('tutorial-image');
    if (image && slides[currentSlide]) {
      image.src = slides[currentSlide];
      image.alt = `Tutorial Step ${currentSlide + 1}`;
    }
    
    // Disable previous button if we are at the beginning
    const prevBtn = document.getElementById('previous');
    if (prevBtn) {
      prevBtn.disabled = currentSlide === 0;
      prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
    }
    
    // Disable next button if we are at the end
    const nextBtn = document.getElementById('next');
    if (nextBtn) {
      nextBtn.disabled = currentSlide === slides.length - 1;
      nextBtn.style.opacity = currentSlide === slides.length - 1 ? '0.5' : '1';
    }
  }
