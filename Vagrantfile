# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrant configuration for Educard K3s deployment
# This creates a local VM to test the k3s deployment

Vagrant.configure("2") do |config|
  # Use Ubuntu 22.04 LTS (works with both ARM and x86)
  config.vm.box = "bento/ubuntu-22.04"

  # VM hostname
  config.vm.hostname = "educard-k3s"

  # Network configuration
  # Private network for accessing from host
  config.vm.network "private_network", ip: "192.168.56.10"
  
  # Forward ports for testing
  config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 443, host: 8443, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 6443, host: 6443, host_ip: "127.0.0.1"

  # VM resources
  config.vm.provider "virtualbox" do |vb|
    vb.name = "educard-k3s"
    vb.memory = "4096"  # 4GB RAM
    vb.cpus = 2         # 2 CPU cores
    
    # Better VM performance
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    vb.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
    vb.customize ["modifyvm", :id, "--ioapic", "on"]
  end

  # Synced folder (optional - for development)
  # Uncomment to sync local code to VM
  # config.vm.synced_folder ".", "/home/vagrant/educard", 
  #   owner: "vagrant", 
  #   group: "vagrant"

  # Provisioning script - runs on first `vagrant up`
  config.vm.provision "shell", inline: <<-SHELL
    set -e
    
    echo "=================================="
    echo "Setting up Educard K3s VM"
    echo "=================================="
    
    # Update system
    echo "Updating system packages..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    
    # Install required packages
    echo "Installing required packages..."
    apt-get install -y curl wget git nano net-tools
    
    # Install K3s
    echo "Installing K3s..."
    curl -sfL https://get.k3s.io | sh -
    
    # Wait for K3s to be ready
    echo "Waiting for K3s to start..."
    sleep 10
    
    # Verify K3s installation
    echo "Verifying K3s installation..."
    systemctl status k3s --no-pager || true
    k3s kubectl get nodes
    
    # Configure k3s to be accessible from host
    echo "Configuring K3s access..."
    
    # Create kubeconfig for host access
    mkdir -p /home/vagrant/.kube
    cp /etc/rancher/k3s/k3s.yaml /home/vagrant/.kube/config
    
    # Update server address to VM IP
    sed -i 's/127.0.0.1/192.168.56.10/g' /home/vagrant/.kube/config
    chown -R vagrant:vagrant /home/vagrant/.kube
    chmod 600 /home/vagrant/.kube/config
    
    # Also create a copy that can be used from host
    mkdir -p /vagrant/k8s
    cp /etc/rancher/k3s/k3s.yaml /vagrant/k8s/kubeconfig-vagrant
    sed -i 's/127.0.0.1/192.168.56.10/g' /vagrant/k8s/kubeconfig-vagrant
    
    # Set up kubectl for vagrant user
    echo 'export KUBECONFIG=/home/vagrant/.kube/config' >> /home/vagrant/.bashrc
    
    # Display info
    echo ""
    echo "=================================="
    echo "K3s Installation Complete!"
    echo "=================================="
    echo ""
    echo "VM Information:"
    echo "  - IP Address: 192.168.56.10"
    echo "  - K3s API: https://192.168.56.10:6443"
    echo "  - HTTP: http://localhost:8080 (forwarded from VM:80)"
    echo "  - HTTPS: https://localhost:8443 (forwarded from VM:443)"
    echo ""
    echo "K3s Version:"
    k3s --version
    echo ""
    echo "To use kubectl from your host machine:"
    echo "  export KUBECONFIG=$(pwd)/k8s/kubeconfig-vagrant"
    echo "  kubectl get nodes"
    echo ""
    echo "Or SSH into VM:"
    echo "  vagrant ssh"
    echo "  kubectl get nodes"
    echo ""
    echo "=================================="
  SHELL

  # Message after VM is up
  config.vm.post_up_message = <<-MESSAGE
    ================================
    Educard K3s VM is ready!
    ================================
    
    VM IP: 192.168.56.10
    
    Access methods:
    1. SSH into VM:
       vagrant ssh
       kubectl get nodes
    
    2. Use kubectl from host:
       export KUBECONFIG=./k8s/kubeconfig-vagrant
       kubectl get nodes
    
    3. Access services:
       - HTTP: http://localhost:8080
       - HTTPS: https://localhost:8443
       - K3s API: https://192.168.56.10:6443
    
    Quick commands:
    - Start VM: vagrant up
    - Stop VM: vagrant halt
    - Restart VM: vagrant reload
    - SSH into VM: vagrant ssh
    - Destroy VM: vagrant destroy
    
    Next steps:
    1. Test kubectl connection
    2. Continue with Task 5.2 (Container Registry)
    ================================
  MESSAGE
end
