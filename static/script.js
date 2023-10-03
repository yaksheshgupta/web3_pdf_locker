let web3;

function showNotification(message) {
    const notificationBar = document.getElementById("notificationBar");
    const notificationMessage = document.getElementById("notificationMessage");

    notificationMessage.textContent = message;
    notificationBar.classList.remove("notification-hidden");
    notificationBar.classList.add("notification-visible");

    setTimeout(() => {
        notificationBar.classList.remove("notification-visible");
        notificationBar.classList.add("notification-hidden");
    }, 5000);
}

async function connectMetaMask() {
    const metabutton = document.getElementById("metabutton");
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            showNotification("Connected to MetaMask!");
            // metabutton.textContent = "Metamask connected!!";
            metabutton.textContent = `Welcome! ${ await web3.eth.getAccounts()}`;
        } catch (error) {
            if (error.code === 4001) {  // User rejected request
                showNotification("User denied account access");
            } else {
                showNotification("There was an error connecting to MetaMask.");
                console.error(error);
            }
        }
    } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
    } else {
        showNotification('Non-Ethereum browser detected. Consider using MetaMask!');
    }
}

function generateHash(message, userInput) {
    const combinedMessage = message + userInput;
    return web3.utils.sha3(combinedMessage);
}

async function requestSignature() {
    if (!web3) {
        showNotification("Please connect to MetaMask first.");
        return;
    }

    const userInput = document.getElementById("userInput").value;
    const pdfFileInput = document.getElementById('pdfFile');

    // Check if file is selected
    if (!pdfFileInput.files || pdfFileInput.files.length === 0) {
        showNotification("Please upload a PDF file first.");
        return;
    }

    if (!userInput || userInput.length < 5) {
        showNotification("Please enter a valid piece of information with at least 5 characters.");
        return;
    }

    document.getElementById("memInfoDisplay").innerText = userInput;

    const message = "Please sign this message";
    const messageHash = `Hello buddy!!! ${generateHash(message, userInput)}`;

    const accounts = await web3.eth.getAccounts();
    const signature = await web3.currentProvider.send('personal_sign', [messageHash, accounts[0]]);

    document.getElementById("signatureDisplay").innerText = signature.result;

    // Send the signature and the PDF to the Flask backend
    const formData = new FormData();
    formData.append('file', pdfFileInput.files[0]);
    formData.append('password', signature.result);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'protected_' + pdfFileInput.files[0].name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
            console.error('Error:', error);
            showNotification('An error occurred while processing the PDF.');
        });
}
async function requestSignatureAndDecrypt() {
    if (!web3) {
        showNotification("Please connect to MetaMask first.");
        return;
    }

    const userInput = document.getElementById("userInput").value;
    const pdfFileInput = document.getElementById('encryptedFile');

    // Check if file is selected
    if (!pdfFileInput.files || pdfFileInput.files.length === 0) {
        showNotification("Please upload an encrypted PDF file first.");
        return;
    }

    if (!userInput || userInput.length < 5) {
        showNotification("Please enter a valid piece of information with at least 5 characters.");
        return;
    }
    const message = "Please sign this message";
    const messageHash = `Hello buddy!!! ${generateHash(message, userInput)}`;
    const accounts = await web3.eth.getAccounts();
    const signature = await web3.currentProvider.send('personal_sign', [messageHash, accounts[0]]);

    // Send the signature and the encrypted PDF to the Flask backend
    const formData = new FormData();
    formData.append('encryptedFile', pdfFileInput.files[0]);
    formData.append('password', signature.result);

    fetch('/retrieve', {
        method: 'POST',
        body: formData
    })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'decrypted_' + pdfFileInput.files[0].name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
            console.error('Error:', error);
            showNotification('An error occurred while processing the PDF.');
        });
}
