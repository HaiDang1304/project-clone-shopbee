import { useMemo, useState } from 'react'

export default function ProductGallery() {
  const images = useMemo(
    () => [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv96X-9gaHtQf-WdBsH1yZchA1YuwYxa5OQRwP-P576B4azajDzFnyHo0PSnR7b4xeBOKXk-cYjnzJ2qhLmXsAI3_kV3oKVGghpHbGzcRVH9FTLwpmtscjMEAlbUFC-dLdV5iFHo2_HBU9efVZd873LlpaDiY45w6czLUSWnVdyKL9MCwk_AkgfigU19dA_OtBJEQLccO2s4F7OVS1uORo_LIVQU0pPDSXZUUjTP07wmiB-v7a8iGS_WhpzEQifm6qDkJ7GlyAabu7',
        alt: 'Main Product',
        selected: true,
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTso4p6z9CeiUxv-un7Z46sv601_ZpnhHj7sgq4XvJavigTIMjkDBkaM_HEpZV06BUL7xh6d2p_AQL1Z_DP22loRwHWzQt60GPpNQ9eeUM7hylve0b-mEcU2lFcT06J39IdViEvrM6ft7jiyONGeIUz7_FPXVW_-JGemC1d0tbL6JPVsi07mjisYw6Y0GTwUjhpG-bovkhj2GCOxW85-_wEpRc-sJ-g7NB_d9uHKmR94Ie0h7ufvCh_Pfx8dP9zQPiZRhzkhwJLIQj',
        alt: 'Thumb 1',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcddOdZVDxifqIC7Ml4lskFwzIAXzxVVHM4nAeLFATVlQtb7U28VGqtPNAsx3TUlJ1U1lC_WFNIC1eWHxp37VOTgWZvhPSmZ2-4DG3hUwgrYcww4JgFzdMFFMbSNdstizIewrkg5POfJ1a9446tJ1DECfj1Vwa3wfLWzqG_awNErPrTdCjfM4RCGCxWJ_xVka0w3zNU6ANLhIkY7DeaT9cylQdL0qn7NEKK4vBB0kp2wBysk6vycZJTznMAx2KGHVmkTGOR7waUTtF',
        alt: 'Thumb 2',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA794P7yHRhX5TOUZj5fedO3KVyEc5s7MmYLJIy0x4myeRMHBW_hu2a1zOA-F5phvuDsS2r5OMGblUNCMdJSsTEwNNsxcy7lsZz0azyMsPBTcbpkAodbo1eFNlHYB8GmYisiJT5eqVC45qCRWlXQqyDwmE0pWrnpCIS_i1a9SyCK8eyoatvfDNq8yt_iwPC4vMeCGRjncdTNTKl5UaY8Vtll2Pg23DUci3YioQcBMgHI-wUtbYNNkJBRZc4vmiKv0YrXx_vXcNuzGxC',
        alt: 'Thumb 3',
      },
    ],
    [],
  )

  const [activeSrc, setActiveSrc] = useState(images[0].src)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] aspect-square group relative">
        <img
          alt="Main Product"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={activeSrc}
        />
        <div className="absolute top-4 left-4 bg-error text-white px-3 py-1 rounded-full font-label-md text-label-md font-bold">
          -15%
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {images.slice(1).map((img, index) => {
          const isActive = activeSrc === img.src
          return (
            <button
              key={img.src}
              className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                isActive ? 'border-2 border-primary' : 'border border-outline-variant hover:border-primary'
              }`}
              type="button"
              onClick={() => setActiveSrc(img.src)}
              aria-label={`Ảnh thu nhỏ ${index + 1}`}
            >
              <img alt={img.alt} className="w-full h-full object-cover" src={img.src} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
