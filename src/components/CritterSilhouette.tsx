import React from 'react';
import { CritterFamilyId } from '../types/dive';

interface CritterSilhouetteProps {
  familyId: CritterFamilyId;
  className?: string;
}

/**
 * Zero-Bloat Taxonomic Critter Silhouette Renderer
 * Uses clean vector paths with stroke/fill opacity — zero raster dependencies,
 * zero black dots, and 100% offline reliability.
 */
export const CritterSilhouette: React.FC<CritterSilhouetteProps> = ({
  familyId,
  className = 'w-6 h-6',
}) => {
  switch (familyId) {
    case 'frogfish':
      // Antennariidae — Globular body, leg-like pectoral fin, forward illicium & esca lure
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Frogfish family silhouette">
          <path
            d="M18 28C18 17.5 26.5 11 38 11C47.5 11 53 16.5 55 22L61 17V33L55 28C52.5 34.5 45.5 38 36 38C25 38 18 34 18 28Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Dorsal spines & filamentous warts */}
          <path
            d="M27 13L29 7L34 11M36 11L40 6L44 12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Illicium fishing rod & glowing esca lure */}
          <path
            d="M22 18C17 11 11 9 7 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="15.5" r="2.6" fill="currentColor" />
          {/* Leg-like pectoral fin */}
          <path
            d="M31 35L27 43M27 43L23 43M27 43L29 44"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="24.5" cy="22.5" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'cuttlefish':
      // Sepiidae — Broad oval mantle, undulating lateral fin skirt, W-eye, 8 short arms
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Cuttlefish family silhouette">
          {/* Outer undulating fin skirt */}
          <path
            d="M10 24C10 13 21 8 34 9C43 10 47 15 48 24C47 33 43 38 34 39C21 40 10 35 10 24Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="3 1.5"
          />
          {/* Inner mantle */}
          <path
            d="M14 24C14 16 23 13 35 14C42 15 46 19 46 24C46 29 42 33 35 34C23 35 14 32 14 24Z"
            fill="currentColor"
            fillOpacity="0.26"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          {/* Tentacle crown */}
          <path
            d="M46 19C52 17 56 18 60 15M47 22C53 21 57 22 61 21M47 26C53 27 57 26 61 27M46 29C52 31 56 30 60 33"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="42" cy="21" r="2" fill="currentColor" />
        </svg>
      );

    case 'squid':
      // Loliginidae / Sepiolidae — Torpedo hydro-mantle, diamond caudal fins, two long feeding clubs
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Squid family silhouette">
          {/* Diamond tail fins */}
          <path
            d="M6 24L17 12L26 19L17 24L26 29L17 36L6 24Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Streamlined mantle */}
          <path
            d="M14 24L28 16H44L47 24L44 32H28L14 24Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Arms & 2 long tentacular clubs */}
          <path
            d="M47 20L56 17M47 24L61 24M47 28L56 31M46 18C52 13 57 12 61 13"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="41.5" cy="22" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'octopus':
      // Octopodidae — Bulbous mantle dome, prominent eyes, 8 sweeping curled arms
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Octopus family silhouette">
          {/* Mantle head */}
          <path
            d="M22 18C22 10.5 27 6 33 6C39 6 44 10.5 44 18C44 22 41 25 38 26H28C25 25 22 22 22 18Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          {/* Curled tentacles */}
          <path
            d="M27 26C21 29 14 28 9 33C6 36 8 40 12 39M30 26C26 33 21 38 16 42M33 26V43M36 26C40 33 45 38 50 42M39 26C45 29 52 28 57 33C60 36 58 40 54 39"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle cx="29.5" cy="18" r="1.7" fill="currentColor" />
          <circle cx="36.5" cy="18" r="1.7" fill="currentColor" />
        </svg>
      );

    case 'nudibranch':
      // Gastropoda Nudibranchia — Foot slug profile, dual rhinophore horns, dorsal branchial plume
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Nudibranch family silhouette">
          {/* Muscular foot & mantle */}
          <path
            d="M8 35C12 35 16 22 28 22C39 22 45 27 56 35H8Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Sensory rhinophores (front horns) */}
          <path
            d="M21 23L16 11M25 22L23 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Branchial gill plume / cerata */}
          <path
            d="M37 23L35 13M41 24L42 12M45 26L49 16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle cx="16" cy="10.5" r="1.8" fill="currentColor" />
          <circle cx="23" cy="9.5" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'wrasse':
      // Labridae — Elongated reef fish, continuous dorsal fin, Napoleon/flasher profile
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Wrasse family silhouette">
          <path
            d="M8 24C14 15 26 12 39 14C45 15 49 19 52 21L59 15V33L52 27C49 29 45 33 39 34C26 36 14 33 8 24Z"
            fill="currentColor"
            fillOpacity="0.23"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Continuous dorsal fin */}
          <path
            d="M20 14L24 8L43 10L46 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="22" r="2" fill="currentColor" />
        </svg>
      );

    case 'seahorse':
      // Syngnathidae — Coronet crown, tubular snout, arched neck, prehensile curled tail
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Seahorse family silhouette">
          <path
            d="M23 13L15 15L23 18C21 22 20 27 24 32C28 36 33 38 33 42C33 44.5 29 45 27 43C25.5 41.5 27 39 29 39"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23 13C24 9 28 7 32 9C35 11 34 16 32 20C36 23 37 29 33 34L24 32"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Dorsal fin flutter */}
          <path d="M35 23L41 21V29L35 27" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="27" cy="12.5" r="1.6" fill="currentColor" />
        </svg>
      );

    case 'shrimp':
      // Stomatopoda / Caridea — Peacock Mantis / Harlequin shrimp segmented carapace & raptorial claws
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Crustacean family silhouette">
          <path
            d="M14 28C19 20 31 18 44 21C49 22 53 26 55 31L49 34C44 29 30 28 19 32L14 28Z"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Long antennae & raptorial club */}
          <path
            d="M16 24L6 15M17 26L5 24M22 30L14 38L20 40M29 31L26 39M36 31L35 39"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="22" r="2" fill="currentColor" />
        </svg>
      );

    case 'moray':
      // Muraenidae — Sinuous ribbon/moray eel body & open jaw profile
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Moray Eel family silhouette">
          <path
            d="M10 17L19 13C27 13 33 18 33 24C33 30 25 33 25 38C25 42 35 43 54 38"
            stroke="currentColor"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path d="M10 22L18 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="14.5" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'turtle':
    default:
      // Cheloniidae — Carapace dome, hydrodynamic fore-flippers, sea turtle head
      return (
        <svg viewBox="0 0 64 48" fill="none" className={className} aria-label="Sea Turtle family silhouette">
          <ellipse
            cx="34"
            cy="24"
            rx="15"
            ry="11"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          {/* Head */}
          <path
            d="M19 24C14 24 11 22 11 20C11 18 14 17 19 19"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          {/* Fore flippers */}
          <path
            d="M25 15C21 8 15 6 13 9C12 11 17 16 22 18M25 33C21 40 15 42 13 39C12 37 17 32 22 30"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          {/* Hind flippers */}
          <path d="M47 19L55 15M47 29L55 33" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      );
  }
};
