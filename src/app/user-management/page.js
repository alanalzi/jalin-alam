// "use client"

// import { useSession } from "next-auth/react"
// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"

// export default function UserManagementPage() {
//   const { data: session, status } = useSession()
//   const router = useRouter()

//   // Daftar user dummy sementara (nanti bisa pakai DB)
//   const [users, setUsers] = useState([
//     { id: 1, name: "David Alan", email: "d.alan123707@gmail.com", role: "direktur" },
//     { id: 2, name: "Colan", email: "colan2404@gmail.com", role: "admin" },
//     { id: 3, name: "Budi", email: "budi@example.com", role: "karyawan" }
//   ])

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login")
//     } else if (session?.user?.role !== "direktur") {
//       // Hanya direktur yang boleh akses
//       router.push("/dashboard")
//     }
//   }, [status, session, router])

//   if (status === "loading") {
//     return <p>Loading...</p>
//   }

//   // Fungsi ubah role
//   const handleRoleChange = (id, newRole) => {
//     setUsers(prev =>
//       prev.map(user => (user.id === id ? { ...user, role: newRole } : user))
//     )
//   }

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h1>User Management</h1>
//       <table border="1" cellPadding="10" cellSpacing="0">
//         <thead>
//           <tr>
//             <th>Nama</th>
//             <th>Email</th>
//             <th>Role</th>
//             <th>Aksi</th>
//           </tr>
//         </thead>
//         <tbody>
//           {users.map(user => (
//             <tr key={user.id}>
//               <td>{user.name}</td>
//               <td>{user.email}</td>
//               <td>
//                 <select
//                   value={user.role}
//                   onChange={(e) => handleRoleChange(user.id, e.target.value)}
//                 >
//                   <option value="direktur">Direktur</option>
//                   <option value="admin">Admin</option>
//                   <option value="karyawan">Karyawan</option>
//                 </select>
//               </td>
//               <td>
//                 <button onClick={() => alert(`Role ${user.name} disimpan!`)}>
//                   Simpan
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }
