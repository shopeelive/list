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
const storage = firebase.storage();

const quoteForm = document.getElementById('quoteForm');
const quoteInput = document.getElementById('quoteInput');
const quoteList = document.getElementById('quoteList');
const fileList = document.getElementById('fileList');
const fileUploadForm = document.getElementById('fileUploadForm');
const fileInput = document.getElementById('fileInput');
const listLink = document.getElementById('listlink');
const uploadProgress = document.getElementById('uploadProgress');
const progressContainer = document.getElementById('progressContainer');

// Function to render uploaded files
function renderFiles() {
    fileList.innerHTML = '';

    storage.ref('files/files').listAll()
        .then((res) => {
            const promises = res.items.map((itemRef) => {
                return Promise.all([itemRef.getDownloadURL(), itemRef.getMetadata()])
                    .then(([url, metadata]) => {
                        return {
                            name: itemRef.name,
                            url: url,
                            size: metadata.size,
                            timeCreated: new Date(metadata.timeCreated).getTime()
                        };
                    })
                    .catch((error) => {
                        console.error('Error fetching file details: ', error);
                    });
            });

            Promise.all(promises)
                .then((files) => {
                    files.sort((a, b) => b.timeCreated - a.timeCreated);

                    files.forEach((file) => {
                        const fileCard = document.createElement('div');
                        fileCard.classList.add('file-card');

                        const fileName = document.createElement('div');
                        fileName.classList.add('file-name');
                        fileName.textContent = file.name.length > 50 ? file.name.substring(0, 50) + '...' : file.name;
                        fileCard.appendChild(fileName);

                        const fileSize = document.createElement('div');
                        fileSize.classList.add('file-details');
                        fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                        fileCard.appendChild(fileSize);

                        const fileModified = document.createElement('div');
                        fileModified.classList.add('file-details');
                        fileModified.textContent = getTimeString(file.timeCreated);
                        fileCard.appendChild(fileModified);

                        const downloadLink = document.createElement('a');
                        downloadLink.classList.add('file-download');
                        downloadLink.textContent = 'Download';
                        downloadLink.href = file.url;
                        downloadLink.target = '_blank';
                        fileCard.appendChild(downloadLink);

                        fileList.appendChild(fileCard);
                    });
                })
                .catch((error) => {
                    console.error('Error rendering files: ', error);
                });
        })
        .catch((error) => {
            console.error('Error retrieving files: ', error);
        });
}

// Call renderFiles function to display uploaded files
renderFiles();

// Event listener for file upload form submission
fileUploadForm.addEventListener('click', (e) => {
    e.preventDefault();

    const files = fileInput.files;
    if (files.length > 0) {
        Array.from(files).forEach((file, index) => {
            const storageRef = storage.ref('files/files/' + file.name);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.textContent = `Uploading ${file.name}: ${progress.toFixed(2)}%`;
                console.log(`Upload is ${progress}% done for file ${index + 1}`);
            }, (error) => {
                console.error('Error uploading file: ', error);
            }, () => {
                console.log('File uploaded successfully!');
                renderFiles(); // Update file list after upload
                uploadProgress.textContent = '';
            });
        });
    }
});



// Function to render quotes
function renderQuotes() {
    quoteList.innerHTML = ''; // Clear existing list

    database.ref('slader').limitToLast(50).on('value', (snapshot) => {
        let quotes = []; // Collect all quotes first

        snapshot.forEach((childSnapshot) => {
            const quoteId = childSnapshot.key;
            const quoteData = childSnapshot.val();

            if (quoteData && quoteData.quote) {
                quotes.push({ quoteId: quoteId, quote: quoteData.quote });
            }
        });

        quotes.reverse(); // Reverse the order of the quotes

        quotes.forEach((quoteData) => {
            const quote = quoteData.quote;
            const quoteId = quoteData.quoteId;

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
        });
    });
}


// Add Quote
quoteForm.addEventListener('click', (e) => {
    e.preventDefault();
    const quoteText = quoteInput.value.trim();
    const name = 'Anonymous'; // Set the name here or fetch from user input

    if (quoteText !== '') {
        const newQuoteRef = database.ref('slader').push();
        const quoteObject = {
            name: name,
            quote: quoteText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

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

function showlist() {
    fileList.style.display = 'none';
}


function getTimeString(time) {
    const timestamp = new Date(parseInt(time));
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);

    if (diffSec < 120) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} minutes ago`;
    } else if (diffHr < 24) {
        return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays == 1) {
        const hour = timestamp.getHours() > 12 ? (timestamp.getHours() - 12).toString().padStart(2, '0') : (timestamp.getHours() === 0 ? '12' : timestamp.getHours().toString().padStart(2, '0'));
        const meridiem = timestamp.getHours() >= 12 ? 'PM' : 'AM';
        const minute = timestamp.getMinutes().toString().padStart(2, '0');
        return `ytd at ${hour}:${minute}  ${meridiem}`;
    } else if (diffDays < 7) {
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][timestamp.getDay()];
        const hour = timestamp.getHours() > 12 ? (timestamp.getHours() - 12).toString().padStart(2, '0') : (timestamp.getHours() === 0 ? '12' : timestamp.getHours().toString().padStart(2, '0'));
        const meridiem = timestamp.getHours() >= 12 ? 'PM' : 'AM';
        const minute = timestamp.getMinutes().toString().padStart(2, '0');

        return `${dayOfWeek} at ${hour}:${minute} ${meridiem}`;
    } else {
        const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][timestamp.getMonth()];
        const dayOfMonth = timestamp.getDate().toString().padStart(2, '0');
        const hour = timestamp.getHours() > 12 ? (timestamp.getHours() - 12).toString().padStart(2, '0') : (timestamp.getHours() === 0 ? '12' : timestamp.getHours().toString().padStart(2, '0'));
        const meridiem = timestamp.getHours() >= 12 ? 'PM' : 'AM';
        const minute = timestamp.getMinutes().toString().padStart(2, '0');
        return `${month} ${dayOfMonth} at ${hour}:${minute}  ${meridiem}`;
    }
}
