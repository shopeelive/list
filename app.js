// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIVn6iYuZytcF7BGjRjd5idUVmLfqRO6g",
	authDomain: "quotes-react2.firebaseapp.com",
	databaseURL: "https://quotes-react2-default-rtdb.asia-southeast1.firebasedatabase.app",
	projectId: "quotes-react2",
	storageBucket: "quotes-react2.appspot.com",
	messagingSenderId: "911483163774",
	appId: "1:911483163774:web:e1d24ea42b5c1af58d742f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const quoteForm = document.getElementById('quoteForm');
const quoteInput = document.getElementById('quoteInput');
const quoteList = document.getElementById('quoteList');

// Function to render quotes
function renderQuotes() {
    quoteList.innerHTML = ''; // Clear existing list

    database.ref('slader').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const quoteId = childSnapshot.key;
            const quoteData = childSnapshot.val();

            if (quoteData && quoteData.quote) {
                const quote = quoteData.quote;

                // Create list item for each quote
                const li = document.createElement('li');
                li.className = 'quote-item'; // Add CSS class for styling
                li.innerHTML = `
                    <span class="quote-text">${makeClickable(quote)}</span>
                    <div class="quote-buttons">
                        <button onclick="copyQuote('${quote}')" class="copy-button">Copy</button>
                        <button onclick="deleteQuote('${quoteId}')" class="delete-button">Delete</button>
                    </div>
                `;
                quoteList.appendChild(li);
            }
        });
    });
}

// Add Quote
quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const quoteText = quoteInput.value.trim();
    const name = 'Anonymous'; // Set the name here or fetch from user input

    if (quoteText !== '') {
        // Generate a new reference and get the key
        const newQuoteRef = database.ref('slader').push();

        // Build the quote object with name, quote text, and timestamp
        const quoteObject = {
            name: name,
            quote: quoteText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Set the quote object to the new reference key
        newQuoteRef.set(quoteObject)
            .then(() => {
                quoteInput.value = ''; // Clear input
                renderQuotes();
            })
            .catch((error) => {
                console.error('Error adding quote: ', error);
            });
    }
});


// Function to make URLs clickable
function makeClickable(text) {
    if (typeof text !== 'string') {
        return text; // Return unchanged if not a string
    }
    
    // Use regular expression to replace URLs with clickable links
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

// Function to copy quote to clipboard
function copyQuote(quote) {
    navigator.clipboard.writeText(quote)
        .then(() => {
            alert('Quote copied to clipboard!');
        })
        .catch((error) => {
            console.error('Failed to copy quote: ', error);
        });
}

// Function to delete quote
function deleteQuote(quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
        database.ref('slader').child(quoteId).remove()
            .then(() => {
                renderQuotes();
            })
            .catch((error) => {
                console.error('Error deleting quote: ', error);
            });
    }
}

// Initial render
renderQuotes();
