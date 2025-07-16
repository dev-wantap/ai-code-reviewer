document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('review-form');
    const codeInput = document.getElementById('code-input');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');
    const errorSection = document.getElementById('error-section');
    const errorContent = document.getElementById('error-content');
    const retryBtn = document.getElementById('retry-btn');

    // Hide results and error sections initially
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const code = codeInput.value.trim();
        
        // Client-side validation
        if (!code) {
            showError('Please enter some Python code to review.');
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideResults();
        hideError();

        try {
            // Make API request
            const response = await fetch('/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();
            showResults(data.review);

        } catch (error) {
            console.error('Error:', error);
            
            // Handle different types of errors
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                showError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
            } else if (error.message.includes('Server error: 500')) {
                showError('Server error: The AI service is temporarily unavailable. Please try again in a few moments.');
            } else {
                showError(error.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoadingState(false);
        }
    });

    // Retry button handler
    retryBtn.addEventListener('click', function() {
        hideError();
        codeInput.focus();
    });

    // Helper functions
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'flex';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            loadingSpinner.style.display = 'none';
            submitBtn.style.cursor = 'pointer';
        }
    }

    function showResults(review) {
        // Render markdown content
        if (typeof marked !== 'undefined') {
            resultsContent.innerHTML = marked.parse(review);
        } else {
            // Fallback to plain text if marked.js fails to load
            resultsContent.textContent = review;
        }
        resultsSection.style.display = 'block';
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    function hideResults() {
        resultsSection.style.display = 'none';
    }

    function showError(message) {
        errorContent.textContent = message;
        errorSection.style.display = 'block';
        
        // Smooth scroll to error
        setTimeout(() => {
            errorSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    function hideError() {
        errorSection.style.display = 'none';
    }

    // Auto-resize textarea
    codeInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!submitBtn.disabled) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to clear error
        if (e.key === 'Escape') {
            hideError();
        }
    });

    // Focus on code input when page loads
    codeInput.focus();
});