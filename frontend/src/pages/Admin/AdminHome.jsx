import React from 'react'
import Layout from '../../components/Layout'
import WelcomeBanner from '../../components/WelcomeBanner'

function AdminHome() {
  // Render the admin dashboard view with the standard application layout and a welcome banner
  return (
    <Layout>
      <WelcomeBanner />
    </Layout>
  )
}

export default AdminHome
