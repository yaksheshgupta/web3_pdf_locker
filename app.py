from flask import Flask, render_template, request, send_from_directory
import os
from PyPDF2 import PdfReader, PdfWriter

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
PROTECTED_FOLDER = "protected"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROTECTED_FOLDER):
    os.makedirs(PROTECTED_FOLDER)


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file = request.files['file']
        password = request.form['password']

        if file:
            filename = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filename)
            protected_filename = os.path.join(PROTECTED_FOLDER, file.filename)
            protect_pdf(filename, protected_filename, password)
            return send_from_directory(PROTECTED_FOLDER, file.filename, as_attachment=True)

    return render_template('index.html')


def protect_pdf(input_path, output_path, password):
    pdf_reader = PdfReader(input_path)
    pdf_writer = PdfWriter()

    for page in pdf_reader.pages:
        pdf_writer.add_page(page)

    pdf_writer.encrypt(password)

    with open(output_path, 'wb') as output_file_handle:
        pdf_writer.write(output_file_handle)


@app.route('/retrieve', methods=['GET', 'POST'])
def retrieve():
    if request.method == 'POST':
        file = request.files['encryptedFile']
        password = request.form['password']

        if file:
            filename = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filename)
            decrypted_filename = os.path.join(
                PROTECTED_FOLDER, "decrypted_" + file.filename)
            decrypt_pdf(filename, decrypted_filename, password)
            return send_from_directory(PROTECTED_FOLDER, "decrypted_" + file.filename, as_attachment=True)

    return render_template('retrieve.html')


def decrypt_pdf(input_path, output_path, password):
    pdf_reader = PdfReader(input_path)
    pdf_writer = PdfWriter()

    if pdf_reader.is_encrypted:  # Updated this line
        try:
            pdf_reader.decrypt(password)
        except:
            showNotification("Incorrect password. Please try again.")
            return
    
    for page in pdf_reader.pages:
        pdf_writer.add_page(page)
    
    with open(output_path, 'wb') as output_file_handle:
        pdf_writer.write(output_file_handle)


if __name__ == "__main__":
    app.run(debug=True)
