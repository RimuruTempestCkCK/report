import { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function FeatureItem({ title, description, imgSrc, reverse }) {
  return (
    <div className={`feature-item ${reverse ? "reverse" : ""}`}>
      <div className="feature-content">
        <img src={imgSrc} alt={`${title} Icon`} />
        <div className="feature-text">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const scrollToFitur = () => {
    const fiturSection = document.getElementById("fitur");
    if (fiturSection) {
      fiturSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const faqList = [
    {
      question: "Apakah dashboard bisa menampilkan pengingat untuk pengisian data bulanan?",
      answer:
        "Betul, Dashboard juga memberikan notifikasi dan pengingat penting seperti pengisian data bulanan dan info pengeluaran berlebih supaya pengelolaan laporan tetap akurat.",
    },
    {
      question: "Jika terjadi kesalahan dalam menginput data, apakah data tersebut bisa diedit tanpa harus melakukan input ulang?",
      answer:
        "Ya, data transaksi yang sudah dimasukkan bisa diedit melalui menu Select, karena kami menyediakan fitur edit untuk memudahkan koreksi tanpa harus menginput ulang.",
    },
    {
      question: "Bagaimana cara sistem menentukan apakah pengeluaran saya termasuk boros?",
      answer:
        "Sistem menggunakan metode K-Means Clustering untuk menganalisis pola pengeluaran pengguna berdasarkan data historis. Jika pengeluaran kamu masuk dalam kelompok dengan nilai tertinggi atau melebihi rata-rata dari cluster yang terbentuk, maka sistem akan memberikan notifikasi bahwa pengeluaran tersebut termasuk kategori “boros.”",
    },
  ];

  return (
    <div className="landing-container">
      <header className="header">
        <div className="logo">
          <img src="/img/logo.png" alt="Easpen Logo" className="logo-img" />
        </div>

        <nav className="nav-center">
          <ul className="nav-links">
            <li><a href="#fitur">Fitur</a></li>
            <li><a href="#demo">Demo</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>

        <div className="login-button-wrapper">
          <Link to="/login">
            <button className="login-btn">Sign In</button>
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1>
            Klik-Klik, Laporan Beres! <br />
            <span className="hashtag">#EaspenAja</span>
          </h1>
        </div>
        <img
          src="/img/Halo.png"
          alt="Perempuan dengan Laptop"
          className="hero-img"
        />
      </section>

      <div className="intro-wrapper">
        <section className="intro">
          <h2>Kenalan dengan Easpen, yuk?</h2>
          <p>
            Platform web yang dirancang untuk memudahkan pembuatan, pengelolaan,
            dan pelaporan Lembar Pertanggung Jawaban (LPJ) transaksi secara digital.
            Dengan fitur lengkap mulai dari pencatatan data transaksi,
            penggabungan laporan, hingga proses tanda tangan digital.
            Easpen membantu menggantikan sistem manual yang ribet dan
            mempercepat alur administrasi pertanggungjawaban di perusahaan
            atau organisasi. Sistem ini memudahkan berbagai divisi dan level
            manajemen untuk bekerja lebih efisien, terstruktur, dan transparan.
          </p>
          <button className="learn-more-btn" onClick={scrollToFitur}>Learn More</button>
        </section>

        <section className="features" id="fitur">
          <h2>Fitur</h2>
          <div className="feature-list">
            <FeatureItem
              title="Dashboard"
              description="Fitur ini berisi tentang grafik pengeluaran seperti grafik pengeluaran vs pemasukan, pengeluaran antar divisi, dan berbagai notifikasi penting seperti pengingat pengisian data bulanan dan info pengeluaran berlebih."
              imgSrc="/img/dashboard.svg"
              reverse={true} 
            />
            <FeatureItem
              title="Add"
              description="Fitur ini menyediakan form untuk mencatat setiap pengeluaran yang dilakukan. Data yang diisi di sini akan digunakan sebagai dasar penyusunan laporan Lembar pertangggung Jawaban  di tahap selanjutnya."
              imgSrc="/img/add.svg"
              reverse={false} 
            />
            <FeatureItem
              title="Select"
              description="Fitur ini menampilkan riwayat data pengeluaran yang sudah kamu input. Kamu bisa memilih data yang ingin dijadikan dokumen laporan, mengisi informasi penandatanganan, menentukan jumlah tanda tangan yang dibutuhkan, lalu mencetak dokumen tersebut dengan mudah."
              imgSrc="/img/select.svg"
              reverse={true}  
            />
            <FeatureItem
              title="Report"
              description="Fitur ini Berisi laporan yang sudah jadi dan siap digunakan. Pengguna bisa mengunduh laporan dalam format PDF atau Excel."
              imgSrc="/img/report.svg"
              reverse={false}
            />
          </div>
        </section>

        <section className="demo" id="demo">
          <h2>Demo</h2>
          <div className="video-wrapper">
            <iframe
              width="720"
              height="405"
              src="https://www.youtube.com/embed/xEKlhTV2HYI"
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        <section className="faq" id="faq">
          <h2>FAQ - Tanya Jawab Seputar Easpen</h2>
          {faqList.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${activeFaqIndex === i ? "active" : ""}`}
              onClick={() => toggleFaq(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleFaq(i);
              }}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="arrow">&#9662;</span>
              </div>
              {activeFaqIndex === i && <p className="faq-answer">{faq.answer}</p>}
            </div>
          ))}
        </section>
      </div>

      <footer className="footer">
        <p>© 2025 Easpen. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
