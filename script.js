// Notification system
class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);

        const styles = document.createElement('style');
        styles.textContent = `
            .notification-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
            }

            .notification {
                padding: 15px 25px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                transform: translateX(120%);
                transition: transform 0.3s ease-in-out;
                display: flex;
                align-items: center;
                min-width: 300px;
                color: white;
            }

            .notification.success {
                background-color: #4CAF50;
            }

            .notification.error {
                background-color: #f44336;
            }

            .notification.loading {
                background-color: #052d4a;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification-close {
                margin-left: auto;
                cursor: pointer;
                padding: 5px;
                color: white;
                opacity: 0.8;
                font-size: 20px;
                line-height: 1;
            }

            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }
    show(message, type = 'success', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const messageText = document.createElement('span');
        messageText.textContent = message;
        notification.appendChild(messageText);
        
        if (type !== 'loading') {
            const closeButton = document.createElement('span');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '×';
            closeButton.onclick = () => this.hide(notification);
            notification.appendChild(closeButton);
        }
        
        this.container.appendChild(notification);
        
        // Trigger reflow for animation
        notification.offsetHeight;
        notification.classList.add('show');
        
        if (duration && type !== 'loading') {
            setTimeout(() => this.hide(notification), duration);
        }
        
        return notification;
    }
    
    hide(notification) {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 200);
    }
}

function showError(field, message) {
    removeError(field);
    field.classList.add('error-field');
    notifications.show(message, 'error');
}

function removeError(field) {
    field.classList.remove('error-field');
}

function validateField(field) {
    if (!field.value.trim()) {
        const fieldName = field.previousElementSibling.textContent;
        showError(field, `Please fill out ${fieldName}`);
        return false;
    }
    
    // Additional validation for specific fields
    if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
            showError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    if (field.type === 'tel') {
        const phoneRegex = /^\+?[0-9]{8,}$/;
        if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
            showError(field, 'Please enter a valid contact number');
            return false;
        }
    }

    if (field.type === 'number') {
        if (field.placeholder.includes('loan amount') && field.value <= 0) {
            showError(field, 'Please enter a valid loan amount');
            return false;
        }
        if (field.placeholder.includes('loan tenure') && (field.value <= 0 || field.value > 35)) {
            showError(field, 'Loan tenure must be between 1 and 35 years');
            return false;
        }
    }
    
    removeError(field);
    return true;
}

function nextPage() {
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    
    const requiredFields = page1.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (isValid) {
        page1.classList.remove('active');
        page2.classList.add('active');
    }
}

function previousPage() {
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    page2.classList.remove('active');
    page1.classList.add('active');
}

// Initialize notification system
const notifications = new NotificationSystem();

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loanForm');
    const scriptURL = 'https://script.google.com/macros/s/AKfycby3pBqk7IwhxPy2i-QGZU9oUqUfPlF-5Rklt5LKluaYGvDbg-b48_MogK7D12NNuDzy/exec';
    
    // Add names to form fields
    const formFields = {
        'loan_type': 'What are you looking for?',
        'property_type': 'Property Type',
        'property_purchase': 'Property Purchase',
        'loan_amount': 'Loan Amount (SGD)',
        'loan_tenure': 'Loan Tenure (Years)',
        'rate_type': 'Rate Type',
        'name': 'Name',
        'email': 'Email',
        'contact': 'Contact Number'
    };

    Object.entries(formFields).forEach(([name, label]) => {
        const field = Array.from(form.querySelectorAll('input, select'))
            .find(el => el.previousElementSibling?.textContent === label);
        if (field) field.name = name;
    });
    
    // Add real-time validation on blur
    form.addEventListener('blur', function(e) {
        if (e.target.hasAttribute('required')) {
            validateField(e.target);
        }
    }, true);

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPage = document.querySelector('.tlc-form-page.active');
        const requiredFields = currentPage.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        if (isValid) {
            const loadingNotification = notifications.show('Processing your loan request...', 'loading', 0);
            const formData = new FormData(form);
            formData.append('submission_date', new Date().toISOString());
            
            fetch(scriptURL, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    form.reset();
                    notifications.hide(loadingNotification);
                    notifications.show("Your loan request has been submitted successfully! We'll contact you soon with the best rates.", 'success');
                    // Reset to first page
                    const page2 = document.getElementById('page2');
                    const page1 = document.getElementById('page1');
                    if (page2.classList.contains('active')) {
                        page2.classList.remove('active');
                        page1.classList.add('active');
                    }
                } else {
                    throw new Error('Network response was not ok.');
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                notifications.hide(loadingNotification);
                notifications.show('There was an error submitting your form. Please try again.', 'error');
            });
        }
    });
});
// Carousel Section 
class AutoScrollCarousel {
    constructor() {
      this.track = document.querySelector('.tlc-partners-track');
      this.slides = [...document.querySelectorAll('.tlc-partners-slide')];
      this.slideWidth = this.slides[0].getBoundingClientRect().width;
      this.currentPosition = 0;
      this.scrollSpeed = 1; // Pixels per frame
      this.isHovered = false;

      this.initializeCarousel();
    }

    initializeCarousel() {
      // Add event listeners for pause on hover
      this.track.addEventListener('mouseenter', () => this.isHovered = true);
      this.track.addEventListener('mouseleave', () => this.isHovered = false);

      // Start the animation
      this.animate();

      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.slideWidth = this.slides[0].getBoundingClientRect().width;
        }, 250);
      });
    }

    animate() {
      const animate = () => {
        if (!this.isHovered) {
          this.currentPosition -= this.scrollSpeed;
          const resetPosition = -(this.slideWidth + 20) * 9; // Reset after original slides
          
          if (this.currentPosition <= resetPosition) {
            this.currentPosition = 0;
          }
          
          this.track.style.transform = `translateX(${this.currentPosition}px)`;
        }
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  }

  // Initialize the carousel when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new AutoScrollCarousel();
  });

  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        // Toggle active class on the question
        question.classList.toggle('active');
        
        // Toggle active class on the answer
        const answer = question.nextElementSibling;
        answer.classList.toggle('active');
        
        // Close other answers
        document.querySelectorAll('.faq-answer').forEach(otherAnswer => {
            if (otherAnswer !== answer) {
                otherAnswer.classList.remove('active');
                otherAnswer.previousElementSibling.classList.remove('active');
            }
        });
    });
});


document.querySelector('.cta-button').addEventListener('click', function() {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });