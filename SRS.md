

## 1. Sistem Apa yang Akan Dibangun

Sistem yang akan dibangun adalah aplikasi pemesanan makanan kantin berbasis website.

Sistem ini digunakan untuk membantu siswa memesan makanan dan membantu penjual mengelola pesanan yang masuk.

## 2. Dengan Apa Sistem Ini Akan Dibangun

Sistem dapat dibangun menggunakan:

- HTML untuk membuat struktur halaman.
- CSS untuk mengatur tampilan website.
- JavaScript untuk membuat fitur yang lebih interaktif.
- PHP untuk menjalankan proses pada bagian server.
- MySQL untuk menyimpan data pengguna, menu, dan pesanan.
- Visual Studio Code untuk membuat dan mengedit kode.
- Laragon untuk menjalankan server dan database secara lokal.

## 3. Rancangan Alur Sistem pada Setiap Fitur

### Login

Pengguna memasukkan username dan password → sistem mencocokkan dengan data di database → jika sesuai, pengguna masuk ke halaman utama.

### Menu Makanan

Sistem mengambil data makanan dari database → makanan ditampilkan pada halaman menu → siswa dapat memilih makanan yang tersedia.

### Pemesanan

Siswa memilih makanan → menentukan jumlah → sistem menghitung total harga → siswa mengonfirmasi pesanan → data pesanan disimpan ke database.

### Pengelolaan Pesanan

Penjual masuk ke halaman admin → sistem menampilkan pesanan yang masuk → penjual melihat detail pesanan → penjual mengubah status pesanan.

### Status Pesanan

Status awal pesanan adalah "Menunggu" → penjual mulai membuat makanan → status menjadi "Diproses" → setelah selesai status menjadi "Selesai".

## 4. Bagaimana Alur Datanya

Alur data pada sistem kurang lebih seperti ini:

Siswa → Aplikasi → Database → Penjual

Contohnya:

Siswa memilih makanan → data makanan dan jumlah dikirim ke sistem → sistem menghitung total harga → data pesanan disimpan ke database → penjual melihat pesanan → penjual memproses pesanan → status pesanan diperbarui → siswa melihat status pesanannya.

Data yang disimpan di database antara lain:

- Data akun pengguna.
- Data makanan.
- Harga makanan.
- Jumlah makanan.
- Data pesanan.
- Total harga.
- Status pesanan.

## 5. Input dan Output Sistem

### Input

Data yang dimasukkan ke dalam sistem antara lain:

- Username.
- Password.
- Nama makanan.
- Jumlah makanan.
- Pilihan makanan.
- Data pesanan.
- Harga makanan.

### Output

Hasil yang ditampilkan oleh sistem antara lain:

- Daftar menu makanan.
- Harga makanan.
- Isi keranjang.
- Total harga.
- Detail pesanan.
- Status pesanan.
- Informasi pesanan yang masuk ke penjual.

### Hasil yang Diharapkan

Dengan adanya sistem ini, siswa dapat memesan makanan dengan lebih mudah tanpa harus terlalu lama mengantre. Penjual juga dapat melihat dan mengatur pesanan dengan lebih teratur sehingga proses pemesanan menjadi lebih mudah.