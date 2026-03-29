const firebaseConfig = {
    apiKey: "AIzaSyD7156apCcrJnRX9cP8KSazMbILNJgKEt0",
    authDomain: "lois-files.firebaseapp.com",
    databaseURL: "https://lois-files-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lois-files",
    storageBucket: "lois-files.appspot.com",
    messagingSenderId: "294529638144",
    appId: "1:294529638144:web:f2c2c504d1ed9a12641de5"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const storage = firebase.storage();

const tabs = document.querySelectorAll('.nav-tab');
const panes = document.querySelectorAll('.pane');

const quoteForm = document.getElementById('quoteForm');
const quoteForm2 = document.getElementById('quoteForm2');
const quoteInput = document.getElementById('quoteInput');
const quoteList = document.getElementById('quoteList');

const fileList = document.getElementById('fileList');
const fileInput = document.getElementById('fileInput');
const fileUploadForm = document.getElementById('fileUploadForm');
const uploadProgress = document.getElementById('uploadProgress');

const openTab = name => {
    panes.forEach(pane => {
        pane.hidden = pane.dataset.pane !== name;
    });

    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === name);
    });
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        openTab(tab.dataset.tab);
    });
});

const getTimeString = time => {
    return moment(parseInt(time)).fromNow();
};

const cutText = (text, len) => {
    if (text.length <= len) {
        return text;
    }

    return `${text.slice(0, len)}...`;
};

const isLink = text => {
    return /^(https?:\/\/[^\s]+)$/.test(text);
};

const makeBody = data => {
    if (data.state === 'code') {
        const pre = document.createElement('pre');
        pre.className = 'feed-code';
        pre.textContent = data.quote;
        return pre;
    }

    if (isLink(data.quote)) {
        const link = document.createElement('a');
        link.href = data.quote;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = data.quote.length > 72
            ? `${data.quote.slice(0, 30)}...${data.quote.slice(-30)}`
            : data.quote;
        return link;
    }

    const span = document.createElement('span');
    span.textContent = data.quote;
    return span;
};

const copyQuote = quote => {
    navigator.clipboard.writeText(quote)
        .then(() => {
            alert('Copied');
        })
        .catch(error => {
            console.error('Failed to copy quote: ', error);
        });
};

const deleteQuote = quoteId => {
    if (confirm('Delete this post?')) {
        database.ref('slader/list').child(quoteId).remove()
            .catch(error => {
                console.error('Error deleting quote: ', error);
            });
    }
};

const renderQuotes = () => {
    database.ref('slader/list').limitToLast(50).on('value', snapshot => {
        quoteList.innerHTML = '';

        const quotes = [];

        snapshot.forEach(child => {
            const quoteId = child.key;
            const quoteData = child.val();

            if (quoteData && quoteData.quote) {
                quotes.unshift({
                    quoteId: quoteId,
                    quote: quoteData.quote,
                    state: quoteData.state,
                    time: quoteData.timestamp || 0
                });
            }
        });


        quotes.forEach(data => {
            const item = document.createElement('li');
            item.className = 'feed-item';

            const main = document.createElement('div');
            main.className = 'feed-main';

            const head = document.createElement('div');
            head.className = 'feed-head';

            const meta = document.createElement('div');
            meta.className = 'feed-meta';
            meta.textContent = `${data.state === 'code' ? 'code' : 'post'} • ${data.time ? getTimeString(data.time) : 'unknown time'}`;

            const acts = document.createElement('div');
            acts.className = 'feed-acts';

            const copyBtn = document.createElement('span');
            copyBtn.className = 'feed-act';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                copyQuote(data.quote);
            });

            const delBtn = document.createElement('span');
            delBtn.className = 'feed-act';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => {
                deleteQuote(data.quoteId);
            });

            acts.appendChild(copyBtn);
            acts.appendChild(delBtn);

            const body = document.createElement('div');
            body.className = 'feed-body';
            body.appendChild(makeBody(data));

            head.appendChild(meta);
            head.appendChild(acts);

            main.appendChild(head);
            main.appendChild(body);

            item.appendChild(main);

            quoteList.appendChild(item);
        });
    });
};

const renderFiles = () => {
    fileList.innerHTML = '';

    storage.ref('files/2025').listAll()
        .then(res => {
            const jobs = res.items.map(itemRef => {
                return Promise.all([itemRef.getDownloadURL(), itemRef.getMetadata()])
                    .then(([url, meta]) => {
                        return {
                            name: itemRef.name,
                            url: url,
                            size: meta.size,
                            timeCreated: new Date(meta.timeCreated).getTime()
                        };
                    })
                    .catch(error => {
                        console.error('Error fetching file details: ', error);
                        return null;
                    });
            });

            return Promise.all(jobs);
        })
        .then(files => {
            files = files.filter(Boolean);
            files.sort((a, b) => b.timeCreated - a.timeCreated);

            files.forEach(file => {
                const card = document.createElement('div');
                card.className = 'file-card';

                const name = document.createElement('div');
                name.className = 'file-name';
                name.textContent = cutText(file.name, 50);

                const size = document.createElement('div');
                size.className = 'file-details';
                size.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

                const time = document.createElement('div');
                time.className = 'file-details';
                time.textContent = getTimeString(file.timeCreated);

                const link = document.createElement('a');
                link.className = 'file-link';
                link.href = file.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Download';

                card.appendChild(name);
                card.appendChild(size);
                card.appendChild(time);
                card.appendChild(link);

                fileList.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error retrieving files: ', error);
        });
};

quoteForm.addEventListener('click', e => {
    e.preventDefault();

    const quoteText = quoteInput.value.trim();

    if (quoteText !== '') {
        const newQuoteRef = database.ref('slader/list').push();
        const quoteObject = {
            name: 'Anonymous',
            quote: quoteText,
            state: 'nocode',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        newQuoteRef.set(quoteObject)
            .then(() => {
                quoteInput.value = '';
            })
            .catch(error => {
                console.error('Error adding quote: ', error);
            });
    }
});

quoteForm2.addEventListener('click', e => {
    e.preventDefault();

    const quoteText = quoteInput.value.trim();

    if (quoteText !== '') {
        const newQuoteRef = database.ref('slader/list').push();
        const quoteObject = {
            name: 'Anonymous',
            quote: quoteText,
            state: 'code',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        newQuoteRef.set(quoteObject)
            .then(() => {
                quoteInput.value = '';
            })
            .catch(error => {
                console.error('Error adding quote: ', error);
            });
    }
});

fileUploadForm.addEventListener('click', e => {
    e.preventDefault();

    const files = fileInput.files;

    if (files.length > 0) {
        Array.from(files).forEach((file, index) => {
            const storageRef = storage.ref('files/2025/' + file.name);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', snapshot => {
                const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.textContent = `Uploading ${file.name}: ${prog.toFixed(2)}%`;
                console.log(`Upload is ${prog}% done for file ${index + 1}`);
            }, error => {
                console.error('Error uploading file: ', error);
            }, () => {
                renderFiles();
                uploadProgress.textContent = '';
            });
        });
    }
});

openTab('upload');
renderQuotes();
renderFiles();
